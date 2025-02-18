// app/(marketing)/blog/[slug]/page.tsx
import { client } from '@/sanity/lib/client'
import { urlForImage } from '@/sanity/lib/image'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'

async function getPost(slug: string) {
  return await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      mainImage,
      body,
      publishedAt,
      author->{
        name,
        image,
        bio
      },
      categories[]->{
        title
      }
    }
  `, { slug })
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  
  return {
    title: `${post.title} | The AI Botler`,
    description: post.excerpt,
  }
}

const ptComponents = {
  types: {
    image: ({ value }: any) => {
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

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <main className="min-h-screen p-8">
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center">
              {post.author?.image && (
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                  <Image
                    src={urlForImage(post.author.image).url()}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-medium">{post.author?.name}</span>
            </div>
            <span>•</span>
            <time dateTime={post.publishedAt} className="text-gray-500">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            {post.categories && post.categories.length > 0 && (
              <>
                <span>•</span>
                <div className="flex space-x-2">
                  {post.categories.map((category: any) => (
                    <span key={category.title} className="text-blue-600">
                      {category.title}
                    </span>
                  ))}
                </div>
              </>
            )}
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
          <PortableText value={post.body} components={ptComponents} />
        </div>
      </article>
    </main>
  )
}