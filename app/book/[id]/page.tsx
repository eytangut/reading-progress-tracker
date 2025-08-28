import BookPageClient from './client'

// Generate static params for static export
export async function generateStaticParams() {
  // For static export, return a few dummy IDs to satisfy Next.js build
  // The actual routing will be handled client-side
  return [
    { id: 'placeholder' }
  ]
}

export default function BookPage() {
  return <BookPageClient />
}