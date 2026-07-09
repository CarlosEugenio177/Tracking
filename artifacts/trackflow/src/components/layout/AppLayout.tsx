import React from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // If it's a public/auth route, don't show the layout
  if (location === "/" || location.startsWith("/sign-in") || location.startsWith("/sign-up")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex w-full">
      <Sidebar />
      <div className="pl-64 flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center px-8 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {location.split("/")[1] || "Dashboard"}
          </h2>
          <div className="ml-auto flex items-center gap-4">
            <div className="h-8 w-64 bg-input/50 rounded-md border border-border flex items-center px-3">
              <span className="text-xs text-muted-foreground">Search anywhere... (⌘K)</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
