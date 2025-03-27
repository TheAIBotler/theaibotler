// app/(marketing)/blog/page.tsx
import { client } from '@/sanity/lib/client'
import { urlForImage } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { Image as SanityImage } from 'sanity'
import { SearchInput } from '../../../components/SearchInput'
import { CategoryTag } from '../../../components/CategoryTag'


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

async function getPosts(categoryId?: string, searchQuery?: string): Promise<Post[]> {
  const categoryFilter = categoryId 
    ? `&& "${categoryId}" in categories[]._ref`
    : ''
    
  const searchFilter = searchQuery
    ? `&& (
        title match $searchQuery 
        || excerpt match $searchQuery 
        || pt::text(content) match $searchQuery
      )`
    : ''
    
  return await client.fetch(`
    *[_type == "post" ${categoryFilter} ${searchFilter}] | order(publishedAt desc) {
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
  `, { searchQuery: `${searchQuery || ''}*` })
}

export const revalidate = 60

interface BlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const categoryId = params.category as string | undefined
  const searchQuery = params.search as string | undefined
  
  const [categories, posts] = await Promise.all([
    getCategories(),
    getPosts(categoryId, searchQuery)
  ])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">Blog</h1>
            
            <div className="hidden sm:block sm:w-64">
              <SearchInput 
                categories={categories}
                activeCategory={categoryId}
              />
            </div>
            
            <div className="block sm:hidden">
              <SearchInput 
                categories={categories}
                activeCategory={categoryId}
              />
            </div>
          </div>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <Link 
              href={`/blog/${post.slug.current}`}
              key={post._id}
              className="block transition-all hover:transform hover:translate-y-[-3px]"
            >
              <article className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full dark:border-gray-800 bg-white dark:bg-gray-900">
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
                  {post.title}
                  </h2>
                  {post.excerpt && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{post.excerpt}</p>
                  )}
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {post.categories.map(category => (
                        <CategoryTag
                          key={category._id}
                          id={category._id}
                          title={category.title}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
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
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}