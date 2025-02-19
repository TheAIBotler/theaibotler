// app/(marketing)/blog/page.tsx
import { client } from '@/sanity/lib/client'
import { urlForImage } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { Image as SanityImage } from 'sanity'
import { CategoryFilter } from '../../../components/CategoryFilter'

interface Author {
  name: string
  image?: SanityImage
}

interface Category {
  _id: string
  title: string
}

interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  mainImage?: SanityImage
  publishedAt: string
  excerpt?: string
  author?: Author
  categories?: Category[]
}

async function getCategories(): Promise<Category[]> {
  return await client.fetch(`
    *[_type == "category"] {
      _id,
      title
    }
  `)
}

async function getPosts(categoryId?: string): Promise<Post[]> {
  const filter = categoryId 
    ? `&& "${categoryId}" in categories[]._ref`
    : ''
    
  return await client.fetch(`
    *[_type == "post" ${filter}] | order(publishedAt desc) {
      _id,
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt,
      categories[]->{
        _id,
        title
      },
      author->{
        name,
        image
      }
    }
  `)
}

export const revalidate = 60

interface BlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const categoryId = params.category as string | undefined
  
  const [categories, posts] = await Promise.all([
    getCategories(),
    getPosts(categoryId)
  ])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        <CategoryFilter 
          categories={categories}
          activeCategory={categoryId}
        />
        
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <article 
              key={post._id} 
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {post.mainImage && (
                <div className="relative aspect-video">
                  <Image
                    src={urlForImage(post.mainImage).url()}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">
                  <Link 
                    href={`/blog/${post.slug.current}`}
                    className="hover:text-blue-500 transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                )}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {post.categories.map(category => (
                      <span 
                        key={category._id}
                        className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                      >
                        {category.title}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  {post.author?.image && (
                    <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                      <Image
                        src={urlForImage(post.author.image).url()}
                        alt={post.author.name || 'Author'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span>{post.author?.name}</span>
                  <span className="mx-2">•</span>
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}