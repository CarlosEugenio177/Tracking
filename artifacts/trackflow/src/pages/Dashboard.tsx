import React from "react";
import { useGetDashboardStats, useGetDashboardTimeline, useListWorkspaces } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, MousePointerClick, Users, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(workspaceId, {}, { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "dashboard"] } });
  const { data: timeline, isLoading: timelineLoading } = useGetDashboardTimeline(workspaceId, { granularity: "day" }, { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "dashboard", "timeline"] } });

  if (statsLoading || timelineLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border"></div>)}
      </div>
      <div className="h-96 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  const kpis = [
    { name: "Total Clicks", value: stats?.clicks?.toLocaleString() || "0", icon: MousePointerClick, color: "text-primary" },
    { name: "Total Leads", value: stats?.leads?.toLocaleString() || "0", icon: Users, color: "text-chart-2" },
    { name: "Conversions", value: stats?.conversions?.toLocaleString() || "0", icon: Activity, color: "text-chart-3" },
    { name: "Revenue", value: `$${stats?.revenue?.toLocaleString() || "0"}`, icon: DollarSign, color: "text-chart-5" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">{kpi.name}</span>
                <Icon size={16} className={kpi.color} />
              </div>
              <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Performance Timeline</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Top Campaigns</h3>
          <div className="space-y-4 flex-1">
            {stats?.topCampaigns?.map((camp) => (
              <div key={camp.campaignId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <Link href={`/campaigns/${camp.campaignId}`} className="font-medium hover:text-primary transition-colors">
                    {camp.campaignName}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">{camp.clicks} clicks</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${camp.revenue.toLocaleString()}</div>
                  <div className="text-xs text-chart-2 mt-1">{camp.roas}x ROAS</div>
                </div>
              </div>
            ))}
            {(!stats?.topCampaigns || stats.topCampaigns.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No active campaigns
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
