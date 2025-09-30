import { Link } from "react-router-dom"
import SiteHeader from "@/components/SiteHeader"

type Params = { params: { category: string } }

const NEWS: Record<string, Array<{ id: string; title: string; source: string }>> = {
  markets: [
    { id: "n1", title: "Stocks Rally on Cooler Inflation", source: "Bloomberg" },
    { id: "n2", title: "Oil Slips on Demand Concerns", source: "Reuters" },
  ],
  earnings: [{ id: "n3", title: "MegaCap Beats Expectations", source: "WSJ" }],
  economy: [{ id: "n4", title: "Fed Signals Rate Path", source: "FT" }],
  tech: [{ id: "n5", title: "Chipmaker Releases Next-Gen AI GPU", source: "The Verge" }],
}

export default function NewsByCategoryPage({ params }: Params) {
  const list = NEWS[params.category] || []

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <nav className="text-sm text-muted-foreground">
          <Link to="/home/news" className="underline underline-offset-4">
            News
          </Link>
          {" / "}
          <span className="text-foreground">{params.category}</span>
        </nav>

        <h1 className="mt-3 text-2xl font-semibold">Latest in “{params.category}”</h1>
        <ul className="mt-6 space-y-3">
          {list.map((n) => (
            <li key={n.id} className="rounded-lg border bg-card p-4">
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.source}</p>
            </li>
          ))}
          {list.length === 0 && (
            <li className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No articles yet.</li>
          )}
        </ul>
      </main>
    </>
  )
}
