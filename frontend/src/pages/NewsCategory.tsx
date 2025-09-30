import { Link }from "react-router-dom"
import SiteHeader from "@/components/SiteHeader"

const NEWS_CATEGORIES = [
  { slug: "markets", name: "Markets" },
  { slug: "earnings", name: "Earnings" },
  { slug: "economy", name: "Economy" },
  { slug: "tech", name: "Tech" },
]

export default function NewsCategoriesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">News</h1>
        <p className="mt-2 text-muted-foreground">Explore news by category.</p>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {NEWS_CATEGORIES.map((c) => (
            <li key={c.slug} className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <Link
                to={`/home/news/${c.slug}`}
                className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
              >
                View {c.name} news
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
