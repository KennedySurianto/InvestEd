import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"

type Props = React.InputHTMLAttributes<HTMLInputElement>

export default function HoldToRevealPassword({ className, ...props }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [revealed, setRevealed] = React.useState(false)

  function startReveal(e: React.SyntheticEvent) {
    e.preventDefault()
    setRevealed(true)
  }

  function placeCaretAtEnd() {
    const el = inputRef.current
    if (!el) return
    const move = () => {
      const len = el.value.length
      el.focus({ preventScroll: true })
      try {
        el.setSelectionRange(len, len)
      } catch {}
      // extra frame for browsers that reflow selection on type change
      requestAnimationFrame(() => {
        try {
          const l = el.value.length
          el.setSelectionRange(l, l)
        } catch {}
      })
    }
    // wait for React state update (type=password) to flush
    requestAnimationFrame(move)
  }

  function stopReveal() {
    setRevealed(false)
    placeCaretAtEnd()
  }

  return (
    <div className="relative">
      <Input ref={inputRef} {...props} type={revealed ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        aria-label="Hold to reveal password"
        title="Hold to reveal"
        onMouseDown={(e) => {
          e.preventDefault()
          startReveal(e)
        }}
        onMouseUp={stopReveal}
        onMouseLeave={stopReveal}
        onTouchStart={(e) => startReveal(e)}
        onTouchEnd={stopReveal}
        onTouchCancel={stopReveal}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") startReveal(e)
        }}
        onKeyUp={stopReveal}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none"
      >
        <Eye className="h-4 w-4" aria-hidden />
        <span className="sr-only">Hold to reveal</span>
      </button>
    </div>
  )
}
