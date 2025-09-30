import { SectionCard } from "@/components/SectionCard"
import SiteHeader from "@/components/SiteHeader"

export default function Home() {
  return (
    <>
      {/* Using the shared sticky header */}
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Welcome back to InvestEd</h1>
          <p className="mt-2 text-muted-foreground">
            Continue your learning journey and stay updated with the latest market insights.
          </p>
        </header>

        <section aria-labelledby="quick-actions">
          <h2 id="quick-actions" className="sr-only">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SectionCard
              title="Course Categories"
              description="Browse categories, discover courses, and dive into detailed lessons."
              href="/home/courses"
            />
            <SectionCard
              title="News"
              description="Follow market news by category and catch up with the latest headlines."
              href="/home/news"
            />
            <SectionCard
              title="My Enrollments"
              description="Review and manage the courses you’re enrolled in."
              href="/home/enrollments"
            />
            <SectionCard
              title="Lesson Completions"
              description="Track which lessons you’ve completed and what’s next."
              href="/home/completions"
            />
            <SectionCard
              title="Research"
              description="Explore research notes, analyses, and custom watchlists."
              href="/home/research"
            />
            <SectionCard
              title="Forums"
              description="Join community discussions and share your insights."
              href="/home/forums"
            />
          </div>
        </section>
      </main>
    </>
  )
}
