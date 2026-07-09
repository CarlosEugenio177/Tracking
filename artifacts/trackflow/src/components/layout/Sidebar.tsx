import React from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { 
  LayoutDashboard, 
  Megaphone, 
  Link as LinkIcon, 
  Webhook, 
  Activity, 
  DollarSign, 
  Settings,
  LogOut,
  Target
} from "lucide-react";
import { useListWorkspaces } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  
  const activeWorkspace = workspaces?.[0];

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Links", href: "/links", icon: LinkIcon },
    { name: "UTM Generator", href: "/links/utm", icon: Target, isSub: true },
    { name: "Webhooks", href: "/webhooks", icon: Webhook },
    { name: "Events", href: "/events", icon: Activity },
    { name: "Conversions", href: "/conversions", icon: DollarSign },
  ];

  return (
    <div className="w-64 border-r border-border bg-sidebar h-[100dvh] flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 24H36" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            <path d="M28 14L38 24L28 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="24" r="4" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1 className="font-semibold text-sidebar-foreground leading-none">TrackFlow</h1>
          <p className="text-xs text-sidebar-foreground/50 mt-1 truncate w-40">
            {activeWorkspace?.name || "Loading..."}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-medium text-sidebar-foreground/40 mb-2 px-2">OVERVIEW</div>
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"} ${item.isSub ? "ml-6 border-l border-border/50 pl-4" : ""}`}>
              <Icon size={16} />
              {item.name}
            </Link>
          );
        })}

        <div className="mt-8 text-xs font-medium text-sidebar-foreground/40 mb-2 px-2">SYSTEM</div>
        <Link href="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === "/settings" ? "bg-primary/10 text-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"}`}>
          <Settings size={16} />
          Settings
        </Link>
      </div>

      <div className="p-4 border-t border-border">
        <button 
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
