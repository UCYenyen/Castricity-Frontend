"use client";
import {
  LayoutGrid, LineChart, AlertTriangle, FlaskConical,
  Archive, Workflow, Box, Settings, BookOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  href?: string;
  count?: number;
}

const NAV: NavGroup[] = [
  {
    label: "Operasi",
    items: [
      { id: "dash", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
      { id: "fcst", label: "Forecast", icon: LineChart, href: "/forecast" },
      { id: "anom", label: "Anomaly center", icon: AlertTriangle, count: 3, href:"/anomaly-center" },
    ],
  },
  {
    label: "Data",
    items: [
      { id: "feat", label: "Feature drivers", icon: Workflow, href:"/feature-drivers" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { id: "doc", label: "Panduan", href:"https://canva.link/fi3qjsudjzmx3vu", icon: BookOpen },
    ],
  },
];

export function DashboardSidebar(): ReactNode {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="flex size-7 items-center justify-center rounded-md text-sm font-extrabold text-primary-foreground"
            style={{
              background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-green))",
              boxShadow:
                "0 0 24px rgba(6,182,212,0.45),inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            C
          </div>
          <Link href={"/"} className="hover:cursor-pointer">
            <div className="text-sm font-bold tracking-wide text-foreground">
              Castricity
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Peramalan permintaan
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.16em] text-text-faint">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href ? pathname === item.href : false;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild={!!item.href}
                        isActive={isActive}
                        tooltip={item.label}
                        className="text-[13px] font-medium"
                      >
                        {item.href ? (
                          <Link href={item.href} target={item.label === "Panduan" ? "_blank" : undefined}>
                            <Icon size={14} strokeWidth={1.6} />
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <>
                            <Icon size={14} strokeWidth={1.6} />
                            <span>{item.label}</span>
                          </>
                        )}
                      </SidebarMenuButton>
                      {item.count != null && (
                        <SidebarMenuBadge className="text-accent-red">
                          {item.count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="pulse-dot" />
            <span>Aliran data aktif</span>
          </div>
          <div className="mono text-[10px] text-text-faint">
            v2.4.1 · build a17f3
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
