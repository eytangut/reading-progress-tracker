import BookClientPage from "./BookClientPage"

export async function generateStaticParams() {
  // Return empty array since book IDs are stored in localStorage and not known at build time
  return []
}

export default function BookPage() {
  return <BookClientPage />
}
