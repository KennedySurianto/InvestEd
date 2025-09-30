import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import SiteHeader from "@/components/SiteHeader"
import LoginForm from "@/components/LoginForm"

export const metadata = {
  title: "Login | InvestEd",
}

export default function LoginPage() {
  return (
    <main className="min-h-[100svh] bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-balance">
            Welcome back to <span className="text-primary">InvestEd</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Log in to continue learning and access your membership.</p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Enter your credentials to proceed.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
