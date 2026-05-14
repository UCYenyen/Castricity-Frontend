"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <>
      {/* CTA Banner */}
      <section className="py-24 border-b border-border/50 bg-linear-to-br from-accent-cyan/5 via-background to-accent-green/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Siap Memperkuat Ketahanan Jaringan Listrik Indonesia?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Castricity siap digunakan secara offline, transparan, dan dibangun
            untuk realitas infrastruktur energi Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://github.com/UCYenyen/Castricity-Frontend.git"
              target="_blank"
            >
              <Button
                size="lg"
                className="h-12 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Lihat di GitHub <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-medium"
            >
              Unduh Proposal Teknis
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="flex size-6 items-center justify-center rounded text-xs font-extrabold text-primary-foreground"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-cyan), var(--accent-green))",
                  }}
                >
                  C
                </div>
                <span className="text-sm font-bold tracking-wide text-foreground">
                  Castricity
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Platform prakiraan kebutuhan listrik berbasis AI yang
                transparan — dibangun untuk masa depan energi Indonesia yang
                lebih cerdas.
              </p>
              <p className="text-xs text-text-faint mt-4">
                &ldquo;Forecast the Future. Explain Every Watt.&rdquo;
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Platform
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-foreground transition-colors"
                  >
                    Dashboard Operasional
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/UCYenyen/Castricity-Frontend.git"
                    target="_blank"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub Repository
                  </Link>
                </li>
                <li>
                  <span className="text-text-faint">Dokumentasi Teknis</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Tim & Kompetisi
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <span className="text-foreground font-medium">
                    Team Nekat Aja
                  </span>
                </li>
                <li>FindIT! 2026 — Track C</li>
                <li className="text-text-faint text-xs">
                  The Explainable Oracle
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center text-xs text-text-faint flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              &copy; {new Date().getFullYear()} Castricity. Dibangun untuk masa
              depan energi yang lebih transparan.
            </span>
            <span className="mono">v2.4.1</span>
          </div>
        </div>
      </footer>
    </>
  );
}
