import React, { useState } from "react";
import { useListEvents, useListWorkspaces, useListCampaigns } from "@workspace/api-client-react";
import { Filter, Search, ShieldCheck, Zap, Activity, MousePointerClick, Users, Webhook, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Events() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;

  const [filterType, setFilterType] = useState<string>("");
  const [filterLeadId, setFilterLeadId] = useState<string>("");

  const { data: events, isLoading } = useListEvents(
    workspaceId, 
    { eventType: filterType || undefined, leadId: filterLeadId || undefined },
    { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "events", { filterType, filterLeadId }] } }
  );

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'click': return { color: "text-primary", bg: "bg-primary", border: "border-primary/20", icon: <MousePointerClick size={14}/> };
      case 'lead': return { color: "text-chart-2", bg: "bg-chart-2", border: "border-chart-2/20", icon: <Users size={14}/> };
      case 'webhook': return { color: "text-chart-4", bg: "bg-chart-4", border: "border-chart-4/20", icon: <Webhook size={14}/> };
      case 'crm': return { color: "text-chart-5", bg: "bg-chart-5", border: "border-chart-5/20", icon: <Activity size={14}/> };
      case 'sale': return { color: "text-chart-3", bg: "bg-chart-3", border: "border-chart-3/20", icon: <DollarSign size={14}/> };
      default: return { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: <Activity size={14}/> };
    }
  };

  // Necessary icons import inside the file
  const { MousePointerClick, Users, Webhook, DollarSign } = require("lucide-react");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Event Pipeline</h1>
        <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-2">
          <Zap size={14} /> Live Sync Active
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-64 bg-input/50 px-3 py-2 rounded-md border border-border/50">
          <Search size={16} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Filter by Lead ID..." 
            className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 placeholder:text-muted-foreground"
            value={filterLeadId}
            onChange={(e) => setFilterLeadId(e.target.value)}
          />
        </div>
        <div className="w-full md:w-px h-px md:h-6 bg-border"></div>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-xs font-medium text-muted-foreground mr-2"><Filter size={14} className="inline mr-1"/> Event Type:</span>
          {["", "click", "lead", "webhook", "crm", "sale"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${filterType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'}`}
            >
              {type || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="max-w-4xl mx-auto py-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12 animate-pulse">Scanning pipeline...</div>
          ) : events?.length === 0 ? (
            <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
              <ShieldCheck size={32} className="opacity-20 mb-4" />
              <p>No tracking events match your filters.</p>
              <button onClick={() => {setFilterType(''); setFilterLeadId('');}} className="text-primary mt-2 text-sm hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.18rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {events?.map((event) => {
                const style = getEventStyle(event.eventType);
                return (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card ${style.bg} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 hover:scale-110`}>
                      {style.icon}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border border-border bg-background shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                          {event.eventType}
                        </span>
                        <time className="text-xs text-muted-foreground font-mono">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </time>
                      </div>
                      
                      {event.leadId && (
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">Lead ID:</span>
                          <span className="ml-2 font-mono text-sm bg-muted px-1.5 py-0.5 rounded text-foreground">{event.leadId}</span>
                        </div>
                      )}

                      {event.campaignId && (
                        <div className="mb-2 flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Campaign:</span>
                          <Link href={`/campaigns/${event.campaignId}`} className="text-sm font-medium hover:text-primary transition-colors ml-1">
                            {event.campaignName || `Campaign #${event.campaignId}`}
                          </Link>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        {event.source && <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-muted rounded border border-border/50">src: {event.source}</span>}
                        {event.medium && <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-muted rounded border border-border/50">med: {event.medium}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
