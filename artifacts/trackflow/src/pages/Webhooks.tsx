import React, { useState, useMemo } from "react";
import { useListWebhookEndpoints, useListWorkspaces, useCreateWebhookEndpoint } from "@workspace/api-client-react";
import { Webhook, Plus, Activity, Search, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
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

export default function Webhooks() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;
  const { data: endpoints, isLoading } = useListWebhookEndpoints(workspaceId, { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "webhooks"] } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createEndpoint = useCreateWebhookEndpoint();
  
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({ name: "", description: "" });

  const handleCopy = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEndpoints = useMemo(() => {
    if (!search.trim()) return endpoints;
    return endpoints?.filter(ep => ep.name.toLowerCase().includes(search.toLowerCase()) || ep.url.toLowerCase().includes(search.toLowerCase()));
  }, [endpoints, search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndpoint.name.trim()) return;
    createEndpoint.mutate({ workspaceId, data: { name: newEndpoint.name, description: newEndpoint.description || undefined } }, {
      onSuccess: () => {
        toast({ title: "Endpoint criado com sucesso." });
        queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "webhooks"] });
        setCreateOpen(false);
        setNewEndpoint({ name: "", description: "" });
      },
      onError: () => toast({ title: "Erro ao criar endpoint.", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Criar Endpoint
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Webhook size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold">{endpoints?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Endpoints Ativos</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center text-chart-2">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold">{endpoints?.reduce((acc, ep) => acc + ep.totalEvents, 0).toLocaleString('pt-BR') || 0}</div>
            <div className="text-xs text-muted-foreground">Total de Eventos Recebidos</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center text-chart-4">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold">99,9%</div>
            <div className="text-xs text-muted-foreground">Taxa de Entrega</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
          <div className="flex-1 flex items-center gap-2 bg-input/50 px-3 py-1.5 rounded-md border border-border/50">
            <Search size={16} className="text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar endpoints..." 
              className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nome do Endpoint</th>
                <th className="px-6 py-4 font-medium">URL de Ingestão</th>
                <th className="px-6 py-4 font-medium text-right">Total de Eventos</th>
                <th className="px-6 py-4 font-medium text-right">Último Recebimento</th>
                <th className="px-6 py-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Carregando endpoints...</td>
                </tr>
              ) : filteredEndpoints?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground flex flex-col items-center">
                    <Webhook size={32} className="opacity-20 mb-3" />
                    <p>{search ? "Nenhum endpoint corresponde à busca." : "Nenhum endpoint configurado. Crie um para começar a receber dados."}</p>
                  </td>
                </tr>
              ) : (
                filteredEndpoints?.map((endpoint) => (
                  <tr key={endpoint.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/webhooks/${endpoint.id}`} className="font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                        <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
                        {endpoint.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded border border-border/50 truncate max-w-[300px]">
                          {endpoint.url}
                        </span>
                        <button 
                          onClick={() => handleCopy(endpoint.url, endpoint.id)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                        >
                          {copiedId === endpoint.id ? <CheckCircle2 size={14} className="text-chart-2" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {endpoint.totalEvents.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {endpoint.lastEventAt ? new Date(endpoint.lastEventAt).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/webhooks/${endpoint.id}`} className="text-primary text-xs font-medium hover:underline">
                        Ver Logs
                      </Link>
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
            <DialogTitle>Criar Endpoint</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <input
                type="text"
                required
                autoFocus
                className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ex.: CRM_Leads"
                value={newEndpoint.name}
                onChange={e => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                placeholder="Para que esse endpoint será usado?"
                value={newEndpoint.description}
                onChange={e => setNewEndpoint({ ...newEndpoint, description: e.target.value })}
              />
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
                disabled={createEndpoint.isPending}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createEndpoint.isPending ? "Criando..." : "Criar Endpoint"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
