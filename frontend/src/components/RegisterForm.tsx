import * as React from "react"
import { useSearchParams, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import HoldToRevealPassword from "@/components/HoldToRevealPassword"

type PlanValue = "6-months" | "12-months" | "lifetime"

const PLAN_LABELS: Record<PlanValue, string> = {
  "6-months": "6 Months",
  "12-months": "12 Months",
  lifetime: "Lifetime",
}

const PLAN_PRICES: Record<PlanValue, string> = {
  "6-months": "$89",
  "12-months": "$149",
  lifetime: "$299",
}

const PLAN_CONTENT: Array<{
  value: PlanValue
  title: string
  subtitle: string
  benefits: string[]
  mostPopular?: boolean
}> = [
  {
    value: "6-months",
    title: "6 Months",
    subtitle: "Great to get started",
    benefits: ["All core courses", "Weekly market news briefs", "Community forum (basic)"],
  },
  {
    value: "12-months",
    title: "12 Months",
    subtitle: "Best value for learners",
    benefits: [
      "All courses + new releases",
      "Bi‑weekly research notes",
      "Priority forum topics",
      "Member-only webinars",
    ],
    mostPopular: true,
  },
  {
    value: "lifetime",
    title: "Lifetime",
    subtitle: "Invest once, learn forever",
    benefits: [
      "Lifetime updates to all courses",
      "Full research archive access",
      "Private forum circle",
      "Early access to new modules",
    ],
  },
]

export default function RegisterForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast() // Use the correct property from useToast

  const initialPlan = ((): PlanValue => {
    const q = (searchParams?.get("plan") || "").toLowerCase()
    return (["6-months", "12-months", "lifetime"].includes(q) ? q : "12-months") as PlanValue
  })()

  const [membership, setMembership] = React.useState<PlanValue>(initialPlan)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const fullName = String(fd.get("full_name") || "").trim()
    const email = String(fd.get("email") || "").trim()
    const password = String(fd.get("password") || "")
    const confirm = String(fd.get("password_confirm") || "")

    if (!fullName || !email || !password || !confirm) {
      setError("Please fill in all fields.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    try {
      setSubmitting(true)
      // Here you would call your API to create the account.
      // We just show a success toast for now.
      await new Promise((r) => setTimeout(r, 600))

      showToast({
        title: "Welcome to InvestEd!",
        description: `Account for ${fullName} created with ${PLAN_LABELS[membership]} access.`,
        type: "success",
      })

      // Navigate to a post-register page (placeholder: home)
      navigate("/")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" name="full_name" placeholder="Jane Doe" autoComplete="name" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="name@example.com" autoComplete="email" required />
      </div>

      <div className="grid gap-2 md:grid-cols-2 md:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <HoldToRevealPassword id="password" name="password" minLength={8} autoComplete="new-password" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password_confirm">Password Confirmation</Label>
          <HoldToRevealPassword
            id="password_confirm"
            name="password_confirm"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      <div className="grid gap-3">
        <Label className="text-base">Membership Type</Label>

        <div role="radiogroup" aria-label="Membership Type" className="grid gap-4 md:grid-cols-3">
          {PLAN_CONTENT.map((plan) => {
            const selected = membership === plan.value
            return (
              <label key={plan.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="membership-radio"
                  value={plan.value}
                  className="sr-only"
                  checked={selected}
                  onChange={() => setMembership(plan.value)}
                />
                <Card
                  data-selected={selected ? "true" : "false"}
                  className={cn(
                    "transition-all border bg-card text-card-foreground h-full",
                    "hover:shadow-md focus-within:ring-2 focus-within:ring-primary",
                    selected ? "border-primary ring-2 ring-primary" : "border-muted",
                  )}
                >
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      {plan.mostPopular ? (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-primary text-primary-foreground">
                          Most Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                    <p className="text-xl font-semibold leading-none">{PLAN_PRICES[plan.value]}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {plan.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </label>
            )
          })}
        </div>

        <input type="hidden" name="membership" value={membership} />
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:opacity-90">
        {submitting ? "Creating..." : "Create Account"}
      </Button>

      <p className="text-xs text-muted-foreground">By continuing you agree to our Terms and Privacy Policy.</p>
    </form>
  )
}
