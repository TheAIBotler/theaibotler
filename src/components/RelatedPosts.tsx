// components/RelatedPosts.tsx
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/sanity/lib/image'
import { Image as SanityImage } from 'sanity'

interface RelatedPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  mainImage?: SanityImage
  publishedAt: string
  excerpt?: string
  categories?: {
    title: string
  }[]
}

interface RelatedPostsProps {
  posts: RelatedPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) return null

  return (
    <section className="mt-16 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid gap-8 md:grid-cols-3">
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
              <h3 className="text-lg font-semibold mb-2">
                <Link 
                  href={`/blog/${post.slug.current}`}
                  className="hover:text-blue-500 transition-colors"
                >
                  {post.title}
                </Link>
              </h3>
              {post.excerpt && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              {post.categories && post.categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {post.categories.map(category => (
                    <span 
                      key={category.title}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                    >
                      {category.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}