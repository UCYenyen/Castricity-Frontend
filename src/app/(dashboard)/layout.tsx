import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        
        <SidebarInset className="min-w-0 bg-transparent">
          <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-popover/85 p-3 backdrop-blur">
            <SidebarTrigger />
            <span className="font-bold tracking-wide">Castricity</span>
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
