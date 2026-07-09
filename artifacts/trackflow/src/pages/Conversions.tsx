import React from "react";
import { useGetConversionSummary, useListWorkspaces, useListConversions } from "@workspace/api-client-react";
import { DollarSign, Percent, TrendingUp, BarChart3, Filter } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "wouter";

export default function Conversions() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;

  const { data: summary, isLoading: summaryLoading } = useGetConversionSummary(
    workspaceId, 
    {}, 
    { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "conversions", "summary"] } }
  );

  const { data: conversions, isLoading: conversionsLoading } = useListConversions(
    workspaceId,
    {},
    { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "conversions"] } }
  );

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (summaryLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border"></div>)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-80 bg-card rounded-xl border border-border"></div>
        <div className="h-80 bg-card rounded-xl border border-border"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Conversions</h1>
        <button className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors border border-border">
          <Filter size={16} /> Date Range: Last 30 Days
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
          <div className="flex items-center justify-between text-muted-foreground relative z-10">
            <span className="text-sm font-medium">Total Revenue</span>
            <DollarSign size={16} className="text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight relative z-10">
            ${summary?.totalRevenue?.toLocaleString() || "0"}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-bl-full -z-0"></div>
          <div className="flex items-center justify-between text-muted-foreground relative z-10">
            <span className="text-sm font-medium">Verified Conversions</span>
            <TrendingUp size={16} className="text-chart-2" />
          </div>
          <div className="text-4xl font-bold tracking-tight relative z-10">
            {summary?.totalConversions?.toLocaleString() || "0"}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chart-3/5 rounded-bl-full -z-0"></div>
          <div className="flex items-center justify-between text-muted-foreground relative z-10">
            <span className="text-sm font-medium">Avg. Ticket Size</span>
            <Percent size={16} className="text-chart-3" />
          </div>
          <div className="text-4xl font-bold tracking-tight relative z-10">
            ${summary?.averageTicket?.toLocaleString() || "0"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" /> Revenue by Platform
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.byPlatform || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="label"
                  stroke="none"
                >
                  {(summary?.byPlatform || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
            {(summary?.byPlatform || []).map((entry, index) => (
              <div key={entry.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-muted-foreground">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-chart-2" /> Top Campaigns (ROAS)
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.byCampaign?.slice(0, 5) || []} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  formatter={(value: number) => [`${value}x`, 'ROAS']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                />
                <Bar dataKey="roas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-semibold">Recent Conversions Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Lead ID</th>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conversionsLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading ledger...</td></tr>
              ) : conversions?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No conversions recorded yet.</td></tr>
              ) : (
                conversions?.map((conv) => (
                  <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {new Date(conv.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded border border-border/50">{conv.leadId || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {conv.campaignId ? (
                        <Link href={`/campaigns/${conv.campaignId}`} className="font-medium hover:text-primary transition-colors">
                          {conv.campaignName}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {conv.source || conv.platform || 'Direct'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-chart-2">
                      ${conv.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
