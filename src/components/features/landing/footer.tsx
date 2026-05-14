"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="flex size-6 items-center justify-center rounded text-xs font-extrabold text-primary-foreground"
                style={{
                  background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-green))",
                }}
              >
                C
              </div>
              <span className="text-sm font-bold tracking-wide text-foreground">
                Castricity
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Platform peramalan permintaan listrik generasi terbaru yang dirancang untuk operasi jaringan listrik modern.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Produk</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dasbor Operasional</Link></li>
              <li><Link href="/live" className="hover:text-foreground transition-colors">Peramal Langsung</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Anomaly Center</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Terhubung</h3>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full text-sm">
                Buka Aplikasi <ArrowRight className="ml-2 size-3" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-xs text-text-faint flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Castricity Inc.</span>
          <span className="mono">v2.4.1</span>
        </div>
      </div>
    </footer>
  );
}
