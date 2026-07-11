import React, { useState } from "react";
import { useListCampaigns, useListWorkspaces, useCreateCampaign, useUpdateCampaign, useDeleteCampaign } from "@workspace/api-client-react";
import { Search, Plus, Filter, MoreHorizontal, Check, Trash2, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const STATUS_PT: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  draft: "Rascunho",
};

const STATUS_OPTIONS = ["active", "paused", "completed", "draft"];
const PLATFORM_OPTIONS = ["Meta Ads", "Google Ads", "LinkedIn", "TikTok", "E-mail"];

export default function Campaigns() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: "", platform: "", budget: "", status: "draft" });

  const { data: campaigns, isLoading } = useListCampaigns(
    workspaceId, 
    { search: search || undefined, status: (statusFilter || undefined) as any }, 
    { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "campaigns", search, statusFilter] } }
  );

  const invalidateCampaigns = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "campaigns"] });
  };

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) return;
    createCampaign.mutate({
      workspaceId,
      data: {
        name: newCampaign.name,
        platform: newCampaign.platform || undefined,
        budget: newCampaign.budget ? Number(newCampaign.budget) : undefined,
        status: newCampaign.status as any,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Campanha criada com sucesso." });
        invalidateCampaigns();
        setCreateOpen(false);
        setNewCampaign({ name: "", platform: "", budget: "", status: "draft" });
      },
      onError: () => toast({ title: "Erro ao criar campanha.", variant: "destructive" })
    });
  };

  const handleToggleStatus = (campaignId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    // draft/completed campaigns are reactivated; active campaigns are paused and vice versa
    updateCampaign.mutate({ workspaceId, campaignId, data: { status: nextStatus as any } }, {
      onSuccess: () => {
        toast({ title: nextStatus === "active" ? "Campanha ativada." : "Campanha pausada." });
        invalidateCampaigns();
      },
      onError: () => toast({ title: "Erro ao atualizar campanha.", variant: "destructive" })
    });
    setOpenMenuId(null);
  };

  const handleDelete = (campaignId: number) => {
    if (!confirm("Excluir esta campanha? Essa ação não pode ser desfeita.")) return;
    deleteCampaign.mutate({ workspaceId, campaignId }, {
      onSuccess: () => {
        toast({ title: "Campanha excluída." });
        invalidateCampaigns();
      },
      onError: () => toast({ title: "Erro ao excluir campanha.", variant: "destructive" })
    });
    setOpenMenuId(null);
  };

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
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm relative">
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
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-md ${statusFilter ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Filter size={16} /> {statusFilter ? `Status: ${STATUS_PT[statusFilter]}` : "Filtrar"}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-md shadow-lg z-20 py-1">
                <button
                  onClick={() => { setStatusFilter(""); setFilterOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                >
                  Todos os status {!statusFilter && <Check size={14} />}
                </button>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    {STATUS_PT[s]} {statusFilter === s && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenuId === campaign.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-6 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-20 py-1 text-left">
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <Pencil size={14} /> Ver detalhes
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                            >
                              <Check size={14} /> {campaign.status === "active" ? "Pausar campanha" : "Ativar campanha"}
                            </button>
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <input
                type="text"
                required
                autoFocus
                className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ex.: Promo_Q3_Liquidacao"
                value={newCampaign.name}
                onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plataforma</label>
              <select
                className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newCampaign.platform}
                onChange={e => setNewCampaign({ ...newCampaign, platform: e.target.value })}
              >
                <option value="">Selecione a plataforma</option>
                {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Orçamento (R$)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0,00"
                  value={newCampaign.budget}
                  onChange={e => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newCampaign.status}
                  onChange={e => setNewCampaign({ ...newCampaign, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_PT[s]}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createCampaign.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createCampaign.isPending ? "Criando..." : "Criar Campanha"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
