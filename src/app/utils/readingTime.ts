// app/utils/readingTime.ts
import { PortableTextBlock } from 'sanity'

type TypedObject = {
  _type: string
  _key?: string
  markDefs?: Array<{ _type: string; _key: string }>
  style?: string
  list?: string
}

interface SpanType extends TypedObject {
  _type: 'span'
  text: string
  marks?: string[]
}

export function estimateReadingTime(blocks: PortableTextBlock[] = []): number {
  const WORDS_PER_MINUTE = 225 // Average reading speed

  // Count words in all text blocks
  const wordCount = blocks.reduce((acc, block) => {
    // Handle different block types
    if (block._type === 'block' && Array.isArray(block.children)) {
      // Extract text content from spans
      const text = block.children
        .filter((child): child is SpanType => child._type === 'span')
        .map(span => span.text)
        .join(' ') || ''
      
      // Count words in text
      return acc + text.split(/\s+/).filter(Boolean).length
    }
    
    // Add estimated word equivalent for images (worth ~10 seconds of attention = ~40 words)
    if (block._type === 'image') {
      return acc + 40
    }
    
    return acc
  }, 0)

  // Calculate reading time in minutes, rounded up to nearest minute
  return Math.ceil(wordCount / WORDS_PER_MINUTE)
}