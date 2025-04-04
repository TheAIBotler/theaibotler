// app/(marketing)/blog/[slug]/page.tsx
import { client } from '@/sanity/lib/client'
import { urlForImage } from '@/sanity/lib/image'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { Image as SanityImage, PortableTextBlock } from 'sanity'
import { Metadata } from 'next'
import { estimateReadingTime } from '@/app/utils/readingTime'
import { RelatedPosts } from '@/components/RelatedPosts'
import { ShareButtons } from '@/components/ShareButtons'
import { CategoryTag } from '@/components/CategoryTag'
import CommentsContainer from '@/components/CommentsContainer'
import { createClient } from '@supabase/supabase-js'
import { CommentWithReplies } from '@/app/utils/supabase/types'

interface Author {
  name: string
  image?: SanityImage
  bio?: PortableTextBlock[]
}

interface Category {
  _id: string
  title: string
}

interface Post {
  _id: string
  title: string
  mainImage?: SanityImage
  body: PortableTextBlock[]
  publishedAt: string
  author?: Author
  categories?: Category[]
  excerpt?: string
  slug: {
    current: string
  }
}

interface PostResponse {
  post: Post
  relatedPosts: Post[]
}

interface PortableImageProps {
  value: SanityImage & {
    alt?: string
    _type: 'image'
    asset: {
      _ref: string
      _type: 'reference'
    }
  }
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  params?: Promise<{ slug: string }>
  searchParams?: Promise<SearchParams>
}

async function getPost(slug: string): Promise<PostResponse> {
  // First get the category ID of the current post 
  const catQuery = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      "category": categories[0]._ref
    }
  `, { slug });

  // Then use that ID to get both the post and related posts
  return await client.fetch(`{
    "post": *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      mainImage,
      body,
      publishedAt,
      slug,
      categories[]->{
        _id,
        title
      },
      author->{
        name,
        image,
        bio
      }
    },
    "relatedPosts": *[
      _type == "post" && 
      slug.current != $slug && 
      categories[]._ref match $category
    ] | order(publishedAt desc) [0...3] {
      _id,
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt,
      categories[]->{
        _id,
        title
      }
    }
  }`, { 
    slug,
    category: catQuery.category 
  });
}

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  if (!props.params) {
    throw new Error('Missing params')
  }
  const params = await props.params
  const { post } = await getPost(params.slug)
  
  return {
    title: `${post.title} | The AI Botler`,
    description: post.excerpt,
  }
}

const ptComponents = {
  types: {
    image: ({ value }: PortableImageProps) => {
      if (!value?.asset?._ref) {
        return null
      }
      return (
        <div className="relative w-full aspect-video my-6">
          <Image
            className="object-cover rounded-lg"
            src={urlForImage(value).url()}
            alt={value.alt || ' '}
            fill
          />
        </div>
      )
    },
  },
}

async function getComments(postId: string): Promise<CommentWithReplies[]> {
  // Create a server-side client directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  // Fetch all comments for this post in a single query
  const { data: allComments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  // Organize comments into a nested structure
  return organizeCommentsIntoThreads(allComments);
}

// Helper function to organize comments into a nested structure
function organizeCommentsIntoThreads(flatComments: CommentWithReplies[]): CommentWithReplies[] {
  // Create a map for quick lookup by ID
  const commentMap = new Map<string, CommentWithReplies>();
  
  // Initialize replies arrays and add to map
  flatComments.forEach(comment => {
    commentMap.set(comment.id, {
      ...comment,
      replies: []
    });
  });
  
  // Organize into parent-child relationships
  const rootComments: CommentWithReplies[] = [];
  
  flatComments.forEach(comment => {
    // Get the comment with initialized replies array from the map
    const commentWithReplies = commentMap.get(comment.id)!;
    
    if (comment.parent_id === null) {
      // This is a root-level comment
      rootComments.push(commentWithReplies);
    } else {
      // This is a reply, add it to its parent's replies array
      const parentComment = commentMap.get(comment.parent_id);
      if (parentComment) {
        parentComment.replies!.push(commentWithReplies);
      } else {
        // If parent not found (rare case), treat as root comment
        rootComments.push(commentWithReplies);
      }
    }
  });
  
  return rootComments;
}



export default async function PostPage(props: Props) {
  if (!props.params) {
    throw new Error('Missing params')
  }
  const params = await props.params
  const { post, relatedPosts } = await getPost(params.slug)
  if (!post) {
    return <div>Post not found</div>
  }

  // Fetch initial comments server-side
  const initialComments = await getComments(post._id)
  const postAuthorImage = post.author?.image ? urlForImage(post.author.image).url() : null

  return (
    <main className="min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
        {/* Keep existing header and content sections */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
          
          <div className="flex flex-col space-y-4">
            {/* Author row */}
            <div className="flex items-center">
              {post.author?.image && (
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                  <Image
                    src={urlForImage(post.author.image).url()}
                    alt={post.author.name || 'Author'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-medium">{post.author?.name}</span>
            </div>

            {/* Metadata row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span>•</span>
                <span>{estimateReadingTime(post.body)} min read</span>
                {post.categories && post.categories.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex space-x-2">
                      {post.categories.map((category) => (
                        <CategoryTag 
                          key={category.title} 
                          id={category._id}
                          title={category.title} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <ShareButtons 
                title={post.title}
                url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug.current}`}
              />
            </div>
          </div>
        </header>

        {post.mainImage && (
          <div className="relative aspect-video mb-8">
            <Image
              src={urlForImage(post.mainImage).url()}
              alt={post.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {post.body && <PortableText value={post.body} components={ptComponents} />}
        </div>

        {/* Comments section - using client component */}
        <CommentsContainer 
          postId={post._id}
          postAuthorImage={postAuthorImage}
          initialComments={initialComments}
        />

        <RelatedPosts posts={relatedPosts} />
      </article>
    </main>
  )
}