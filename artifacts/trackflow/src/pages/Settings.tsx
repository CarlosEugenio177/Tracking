import React, { useState, useEffect } from "react";
import { useListWorkspaces, useUpdateWorkspace } from "@workspace/api-client-react";
import { Building2, Save, Plug, Globe, MessageSquare, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspace = workspaces?.[0];
  const workspaceId = workspace?.id || 1;
  
  const updateWorkspace = useUpdateWorkspace();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", slug: "" });

  useEffect(() => {
    if (workspace) {
      setForm({ name: workspace.name, slug: workspace.slug });
    }
  }, [workspace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspace.mutate(
      { workspaceId, data: form },
      {
        onSuccess: () => toast({ title: "Workspace atualizado com sucesso." }),
        onError: () => toast({ title: "Erro ao atualizar o workspace.", variant: "destructive" })
      }
    );
  };

  const integrations = [
    { name: "Meta Ads", icon: Globe, status: "Em Breve", color: "bg-blue-600" },
    { name: "Google Ads", icon: SearchIcon, status: "Em Breve", color: "bg-red-500" },
    { name: "HubSpot", icon: Database, status: "Em Breve", color: "bg-orange-500" },
    { name: "Slack", icon: MessageSquare, status: "Em Breve", color: "bg-purple-600" },
  ];

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Workspace</h1>
        <p className="text-muted-foreground mt-1">Gerencie a identidade da sua organização e integrações.</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 size={20} className="text-primary" /> Perfil Geral
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Workspace</label>
              <input 
                type="text" 
                required
                className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug do Workspace (URL)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                  app.trackflow.com/
                </span>
                <input 
                  type="text" 
                  required
                  className="flex-1 bg-input/50 border border-border rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.slug}
                  onChange={e => setForm({...form, slug: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={updateWorkspace.isPending}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {updateWorkspace.isPending ? "Salvando..." : <><Save size={16} /> Salvar Alterações</>}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Plug size={20} className="text-chart-5" /> Integrações
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Conecte plataformas externas diretamente à ingestão de dados do TrackFlow.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(int => {
              const Icon = int.icon;
              return (
                <div key={int.name} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white ${int.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="font-semibold">{int.name}</span>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-muted text-muted-foreground rounded-full border border-border/50">
                    {int.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback inline para o ícone de busca, já que não podemos importar logos de marcas do lucide
function SearchIcon(props: any) {
  return <Globe {...props} />;
}
