// src/types/sanity.ts
import { Image, PortableTextBlock, Reference, Slug } from 'sanity'

export interface Author {
  _type: 'author'
  _id: string
  name: string
  image?: Image
  bio?: PortableTextBlock[]
}

export interface Category {
  _type: 'category'
  _id: string
  title: string
  description?: string
}

export interface Post {
  _type: 'post'
  _id: string
  title: string
  slug: Slug
  mainImage?: Image & {
    alt?: string
  }
  publishedAt: string
  excerpt?: string
  author: Reference & {
    name?: string
    image?: Image
  }
  categories?: Reference[]
  body?: PortableTextBlock[]
}