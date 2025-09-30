import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

type SectionCardProps = {
  title: string
  description: string
  href: string
}

export function SectionCard({ title, description, href }: SectionCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group block rounded-lg border bg-card text-card-foreground p-5 transition",
        "hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
      aria-label={title}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-balance">{title}</h3>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs",
            "bg-primary/10 text-primary",
          )}
        >
          Explore
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">{description}</p>
      <div className="mt-4 text-sm text-primary underline underline-offset-4">Go to {title}</div>
    </Link>
  )
}
