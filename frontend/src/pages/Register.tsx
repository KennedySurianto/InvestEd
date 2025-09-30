import { useEffect } from "react"; // 1. Import useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RegisterForm from "@/components/RegisterForm";
import SiteHeader from "@/components/SiteHeader";

export default function Register() {
  useEffect(() => {
    document.title = "Register | InvestEd";
  }, []); // The empty array ensures this runs only once when the component mounts

  return (
    <main className="min-h-[100svh] bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold text-balance md:text-4xl">
            Create your <span className="text-primary">InvestEd</span> account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join to access online courses, market news, research briefs, and
            community forums.
          </p>
        </div>

        {/* This Card component will now work perfectly! */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Fill in your details to get started.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <RegisterForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}