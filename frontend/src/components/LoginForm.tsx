import * as React from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import HoldToRevealPassword from "@/components/HoldToRevealPassword"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") || "").trim()
    const password = String(fd.get("password") || "")

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Use the error message from the API if available
        throw new Error(data.message || "An error occurred during login.")
      }

      login(data.token);

      showToast({ title: "Logged in", description: "Welcome back!", type: "success" })
      navigate("/home")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred.")
      showToast({ title: "Login Failed", description: err.message || "Please try again.", type: "error" }) 
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="name@example.com" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <HoldToRevealPassword id="password" name="password" minLength={8} autoComplete="current-password" required />
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:opacity-90">
        {submitting ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="underline underline-offset-4 hover:text-primary">
          Create one
        </Link>
        .
      </p>
    </form>
  )
}
