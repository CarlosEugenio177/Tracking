import React from "react";
import { useGetCampaign, useGetCampaignStats, useListLinks, useListEvents, useListWorkspaces } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { MousePointerClick, Users, Activity, DollarSign, ArrowLeft, ShieldCheck } from "lucide-react";

const STATUS_PT: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  draft: "Rascunho",
};

const EVENT_TYPE_PT: Record<string, string> = {
  click: "clique",
  lead: "lead",
  webhook: "webhook",
  crm: "crm",
  sale: "venda",
};

export default function CampaignDetail() {
  const params = useParams();
  const campaignId = parseInt(params.id || "0", 10);
  
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;

  const { data: campaign, isLoading: campaignLoading } = useGetCampaign(workspaceId, campaignId, { 
    query: { enabled: !!workspaceId && !!campaignId, queryKey: ["/api/workspaces", workspaceId, "campaigns", campaignId] } 
  });

  const { data: stats, isLoading: statsLoading } = useGetCampaignStats(workspaceId, campaignId, {
    query: { enabled: !!workspaceId && !!campaignId, queryKey: ["/api/workspaces", workspaceId, "campaigns", campaignId, "stats"] }
  });

  const { data: links, isLoading: linksLoading } = useListLinks(workspaceId, { campaignId }, {
    query: { enabled: !!workspaceId && !!campaignId, queryKey: ["/api/workspaces", workspaceId, "links", { campaignId }] }
  });

  const { data: events, isLoading: eventsLoading } = useListEvents(workspaceId, { campaignId }, {
    query: { enabled: !!workspaceId && !!campaignId, queryKey: ["/api/workspaces", workspaceId, "events", { campaignId }] }
  });

  const statusColors: Record<string, string> = {
    active: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    paused: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    completed: "bg-primary/10 text-primary border-primary/20",
    draft: "bg-muted text-muted-foreground border-border",
  };

  const kpis = [
    { name: "Cliques", value: stats?.clicks?.toLocaleString('pt-BR') || "0", icon: MousePointerClick, color: "text-primary" },
    { name: "Leads", value: stats?.leads?.toLocaleString('pt-BR') || "0", icon: Users, color: "text-chart-2" },
    { name: "Conversões", value: stats?.conversions?.toLocaleString('pt-BR') || "0", icon: Activity, color: "text-chart-3" },
    { name: "Receita", value: `R$ ${stats?.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0"}`, icon: DollarSign, color: "text-chart-5" },
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'click': return "bg-primary text-primary-foreground";
      case 'lead': return "bg-chart-2 text-chart-2-foreground";
      case 'webhook': return "bg-chart-4 text-chart-4-foreground";
      case 'crm': return "bg-chart-5 text-chart-5-foreground";
      case 'sale': return "bg-chart-3 text-chart-3-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (campaignLoading || statsLoading) {
    return <div className="animate-pulse space-y-8 p-8 flex-1">
      <div className="h-12 w-64 bg-card rounded-md border border-border"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border"></div>)}
      </div>
      <div className="h-96 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns" className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{campaign?.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider ${campaign?.status ? statusColors[campaign.status] : ''}`}>
              {campaign?.status ? STATUS_PT[campaign.status] || campaign.status : ''}
            </span>
            <span>{campaign?.platform}</span>
            <span>•</span>
            <span>Orçamento: {campaign?.budget ? `R$ ${campaign.budget.toLocaleString('pt-BR')}` : "Sem limite"}</span>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold">Links Rastreados</h3>
              <Link href="/links/utm" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                + Novo Link
              </Link>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium">URL Final</th>
                    <th className="px-4 py-3 font-medium">Fonte/Mídia</th>
                    <th className="px-4 py-3 font-medium text-right">Cliques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {linksLoading ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Carregando links...</td></tr>
                  ) : links?.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nenhum link gerado ainda</td></tr>
                  ) : (
                    links?.map((link) => (
                      <tr key={link.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs truncate max-w-[250px]" title={link.finalUrl}>
                            {link.finalUrl}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {link.utmSource}/{link.utmMedium}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {link.clicks?.toLocaleString('pt-BR') || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-semibold">Eventos Recentes</h3>
              <ShieldCheck size={16} className="text-chart-2" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {eventsLoading ? (
                <div className="text-center text-muted-foreground text-sm py-4">Carregando eventos...</div>
              ) : events?.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">Nenhum evento registrado.</div>
              ) : (
                events?.slice(0, 20).map((event, idx) => (
                  <div key={event.id} className="relative flex gap-4">
                    {idx !== (events?.length ?? 0) - 1 && (
                      <div className="absolute top-6 left-[11px] bottom-[-16px] w-[2px] bg-border z-0"></div>
                    )}
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase tracking-tighter ${getEventColor(event.eventType)}`}>
                      {event.eventType[0]}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{EVENT_TYPE_PT[event.eventType] || event.eventType}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 break-all">
                        {event.leadId && <span className="font-mono text-primary/80">{event.leadId}</span>}
                        {event.source && ` via ${event.source}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
