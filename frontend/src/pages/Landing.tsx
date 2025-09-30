import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import SiteHeader from "@/components/SiteHeader"

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-balance text-4xl md:text-6xl font-extrabold tracking-tight">
            Master the Markets with <span className="text-primary">InvestEd</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-pretty">
            Stock market education for every level—guided courses, timely news, deep-dive research, and an active forum
            to learn together.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <Link to="/register">Start Learning</Link>
            </Button>
            <Button variant="outline">Browse Courses</Button>
          </div>
        </div>

        <div className="mt-12 md:mt-16 rounded-xl border border-border/50 overflow-hidden">
          <img
            src="/images/ref-hero.png"
            alt="InvestEd studio-style hero reference"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5 text-primary shrink-0", className)}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-7.111 7.111a1 1 0 01-1.414 0L3.293 9.918a1 1 0 111.414-1.414l3.061 3.061 6.404-6.404a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Features() {
  const items = [
    {
      title: "Online Courses",
      desc: "Structured, step-by-step paths from basics to advanced strategies.",
    },
    {
      title: "Market News",
      desc: "Curated, timely updates to keep your edge sharp and informed.",
    },
    {
      title: "Deep Research",
      desc: "Actionable reports, screeners, and case studies for conviction.",
    },
    {
      title: "Community Forums",
      desc: "Discuss setups, get feedback, and grow with fellow investors.",
    },
  ]
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Everything you need to invest with confidence</h2>
          <p className="mt-2 text-muted-foreground">
            Four pillars to accelerate your learning curve and sharpen your decisions.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <Card key={it.title} className="bg-secondary/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check />
                  {it.title}
                </CardTitle>
                <CardDescription className="text-foreground">{it.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function ModulesReference() {
  // Inspired by alternating module layout from the references
  return (
    <section id="modules" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-xl overflow-hidden border border-border/50">
          <img
            src="/images/ref-modules-1.png"
            alt="Learning modules reference"
            className="w-full h-auto object-cover"
          />
        </div>
        <div>
          <h3 className="text-3xl font-bold">Core Curriculum</h3>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="mt-1" />
              <span>
                <strong>Personal Finance</strong> foundations to build your investing base.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-1" />
              <span>
                <strong>Asset Classes</strong> explained clearly with real-world context.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-1" />
              <span>
                <strong>Principles of Investing</strong> including risk, return, and market cycles.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 mt-12 grid md:grid-cols-2 gap-10 items-center">
        <div className="order-2 md:order-1">
          <h3 className="text-3xl font-bold">Strategy + Live Insights</h3>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3">
              <Check className="mt-1" />
              <span>Portfolio blueprints tailored by risk profile.</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-1" />
              <span>Ongoing market updates and exclusive research drops.</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-1" />
              <span>Active community threads for feedback and mentorship.</span>
            </li>
          </ul>
        </div>
        <div className="order-1 md:order-2 rounded-xl overflow-hidden border border-border/50">
          <img
            src="/images/ref-modules-2.png"
            alt="Timeline and insights reference"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    {
      name: "6 Months",
      price: "$89",
      desc: "Great for getting started with a focused sprint.",
      highlight: false,
      slug: "6-months",
    },
    {
      name: "1 Year",
      price: "$149",
      desc: "Best value for steady compounding of skills.",
      highlight: true,
      slug: "12-months",
    },
    {
      name: "Lifetime",
      price: "$299",
      desc: "All future updates and community access—forever.",
      highlight: false,
      slug: "lifetime",
    },
  ]
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-balance">Choose your access</h3>
          <p className="mt-2 text-muted-foreground">Flexible plans that match your learning pace.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card key={p.name} className={cn("flex flex-col", p.highlight && "ring-2 ring-primary")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {p.highlight && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground">
                      Popular
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-foreground">{p.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-4xl font-extrabold">{p.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check /> Full curriculum access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check /> Research briefs & updates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check /> Community forums
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full bg-primary text-primary-foreground hover:opacity-90">
                  <Link to={`/register?plan=${p.slug}`}>Get Access</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="community" className="border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="font-bold text-lg">
            <span className="text-primary">Invest</span>Ed
          </div>
          <p className="mt-2 text-muted-foreground">Learn smarter. Invest better.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Explore</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link to="#features" className="hover:text-primary">
                Features
              </Link>
            </li>
            <li>
              <Link to="#modules" className="hover:text-primary">
                Modules
              </Link>
            </li>
            <li>
              <Link to="#pricing" className="hover:text-primary">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Get updates</div>
          <p className="text-muted-foreground">Join our newsletter for market notes and curriculum updates.</p>
          <Button variant="outline" className="mt-3 bg-transparent">
            Subscribe
          </Button>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground pb-8">
        © {new Date().getFullYear()} InvestEd. All rights reserved.
      </div>
    </footer>
  )
}

export default function Page() {
  return (
    <main className="bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Features />
      <ModulesReference />
      <Pricing />
      <Footer />
    </main>
  )
}
