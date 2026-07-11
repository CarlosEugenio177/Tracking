import React, { useState } from "react";
import { useListCampaigns, useListWorkspaces, useCreateCampaign } from "@workspace/api-client-react";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";

const STATUS_PT: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  draft: "Rascunho",
};

export default function Campaigns() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;

  const [search, setSearch] = useState("");
  const { data: campaigns, isLoading } = useListCampaigns(
    workspaceId, 
    { search: search || undefined }, 
    { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "campaigns", search] } }
  );

  const statusColors: Record<string, string> = {
    active: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    paused: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    completed: "bg-primary/10 text-primary border-primary/20",
    draft: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={16} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar campanhas..." 
            className="bg-transparent border-none outline-none text-sm w-full h-9 focus:ring-0 placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-[1px] h-6 bg-border"></div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Filter size={16} /> Filtrar
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Plataforma</th>
                <th className="px-6 py-4 font-medium">Orçamento</th>
                <th className="px-6 py-4 font-medium">Criado em</th>
                <th className="px-6 py-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Carregando campanhas...</td>
                </tr>
              ) : campaigns?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="opacity-20" />
                      <p>Nenhuma campanha encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns?.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/campaigns/${campaign.id}`} className="font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[campaign.status] || statusColors.draft}`}>
                        {STATUS_PT[campaign.status] || campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{campaign.platform || "—"}</td>
                    <td className="px-6 py-4 font-medium">{campaign.budget ? `R$ ${campaign.budget.toLocaleString('pt-BR')}` : "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(campaign.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
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
