"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 items-center justify-center rounded-md text-sm font-extrabold text-primary-foreground"
            style={{
              background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-green))",
              boxShadow:
                "0 0 24px rgba(6,182,212,0.45),inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            C
          </div>
          <div>
            <div className="text-base font-bold tracking-wide text-foreground leading-tight">
              Castricity
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground leading-tight">
              Forecast Electricity
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
