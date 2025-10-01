import { SectionCard } from "@/components/SectionCard"
import AuthHeader from "@/components/AuthHeader"

export default function Home() {
  return (
    <>
      {/* Using the shared sticky header */}
      <AuthHeader />

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
              href="/course-category"
            />
            <SectionCard
              title="News"
              description="Follow market news by category and catch up with the latest headlines."
              href="/news-category"
            />
            <SectionCard
              title="My Enrollments"
              description="Review and manage the courses you’re enrolled in."
              href="/enrollments"
            />
            <SectionCard
              title="Lesson Completions"
              description="Track which lessons you’ve completed and what’s next."
              href="/completions"
            />
            <SectionCard
              title="Research"
              description="Explore research notes, analyses, and custom watchlists."
              href="/research"
            />
            <SectionCard
              title="Forums"
              description="Join community discussions and share your insights."
              href="/forums"
            />
          </div>
        </section>
      </main>
    </>
  )
}
