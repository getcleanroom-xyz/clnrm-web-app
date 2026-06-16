"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      icons={{
        success: <CheckCircleIcon className="size-4 text-green" weight="fill" />,
        warning: <WarningIcon className="size-4 text-[#D4A02B]" weight="fill" />,
        error: <XCircleIcon className="size-4 text-error" weight="fill" />,
        loading: <SpinnerIcon className="size-4 text-green animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "rgba(0,255,65,0.12)",
          "--border-radius": "0px",
          "--success-bg": "var(--surface)",
          "--success-border": "rgba(0,255,65,0.25)",
          "--success-text": "var(--green)",
          "--error-bg": "var(--surface)",
          "--error-border": "rgba(255,59,59,0.25)",
          "--error-text": "var(--error)",
          "--warning-bg": "var(--surface)",
          "--warning-border": "rgba(212,160,43,0.25)",
          "--warning-text": "#D4A02B",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "font-mono text-xs border clip-cut-tr shadow-[0_0_20px_rgba(0,255,65,0.05)]",
          success: "border-green/25",
          error: "border-error/25",
          warning: "border-[#D4A02B]/25",
          title: "font-bold tracking-wide",
          description: "text-white-mid",
          actionButton:
            "clip-spell bg-green-dim/30 border border-green/40 text-green text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 hover:bg-green-dim/50 transition-all",
          cancelButton:
            "clip-spell border border-white-dim/30 text-white-mid text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 hover:border-white-dim/60 transition-all",
          closeButton:
            "text-white-dim hover:text-foreground transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
