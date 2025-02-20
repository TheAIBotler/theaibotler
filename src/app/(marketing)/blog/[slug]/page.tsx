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

interface Author {
  name: string
  image?: SanityImage
  bio?: PortableTextBlock[]
}

interface Category {
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

export default async function PostPage(props: Props) {
  if (!props.params) {
    throw new Error('Missing params')
  }
  const params = await props.params
  const { post, relatedPosts } = await getPost(params.slug)
  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <main className="min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
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
              <div className="flex items-center space-x-3 text-sm text-gray-600">
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
                        <span key={category.title} className="text-blue-600">
                          {category.title}
                        </span>
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

        <div className="prose prose-lg max-w-none">
          {post.body && <PortableText value={post.body} components={ptComponents} />}
        </div>
        <RelatedPosts posts={relatedPosts} />
        <ShareButtons 
          title={post.title}
          url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug.current}`}
        />
      </article>
    </main>
  )
}