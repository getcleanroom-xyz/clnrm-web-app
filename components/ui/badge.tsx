import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap uppercase tracking-[0.12em] transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 clip-tag",
  {
    variants: {
      variant: {
        default: "border-green/30 bg-green-dim/20 text-green",
        live: "border-green/30 bg-green-dim/20 text-green",
        waiting: "border-white-dim/30 bg-surface2 text-white-mid",
        dead: "border-error/30 bg-error/10 text-error",
        outline: "border-border text-foreground",
        ghost: "text-white-dim hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
