import { Link } from "react-router-dom"
import { HashLink } from "react-router-hash-link"
import { Button } from "@/components/ui/button"

export default function SiteHeader() {
  return (
    <header className="w-full border-b border-border/40 sticky top-0 z-30 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold tracking-tight text-xl">
          <span className="text-primary">Invest</span>Ed
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <HashLink smooth to="/#features" className="hover:text-primary">
            Features
          </HashLink>
          <HashLink smooth to="/#modules" className="hover:text-primary">
            Modules
          </HashLink>
          <HashLink smooth to="/#pricing" className="hover:text-primary">
            Pricing
          </HashLink>
          <HashLink smooth to="/#community" className="hover:text-primary">
            Community
          </HashLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link to="/register">Join Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
