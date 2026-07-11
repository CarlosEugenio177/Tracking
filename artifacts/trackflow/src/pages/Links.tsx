import React, { useState } from "react";
import { useListLinks, useListWorkspaces } from "@workspace/api-client-react";
import { Search, Plus, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Links() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;
  const [search, setSearch] = useState("");
  const { data: links, isLoading } = useListLinks(
    workspaceId, 
    { search: search || undefined },
    { query: { enabled: !!workspaceId, queryKey: ["/api/workspaces", workspaceId, "links", search] } }
  );

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Links Rastreados</h1>
        <Link href="/links/utm" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Gerar UTM
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={16} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar URLs ou parâmetros..." 
            className="bg-transparent border-none outline-none text-sm w-full h-9 focus:ring-0 placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">URL Final</th>
                <th className="px-6 py-4 font-medium">Campanha</th>
                <th className="px-6 py-4 font-medium">Fonte / Mídia</th>
                <th className="px-6 py-4 font-medium">Cliques</th>
                <th className="px-6 py-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Carregando links...</td>
                </tr>
              ) : links?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Nenhum link encontrado</td>
                </tr>
              ) : (
                links?.map((link) => (
                  <tr key={link.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 max-w-[300px]">
                        <div className="font-medium truncate" title={link.finalUrl}>{link.finalUrl}</div>
                        <div className="text-xs text-muted-foreground truncate" title={link.originalUrl}>{link.originalUrl}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {link.campaignId ? (
                        <Link href={`/campaigns/${link.campaignId}`} className="text-primary hover:underline">
                          {link.campaignName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{link.utmSource || '—'}</span>
                        <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{link.utmMedium || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {link.clicks?.toLocaleString('pt-BR') || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => handleCopy(link.finalUrl, link.id)}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="Copiar URL"
                        >
                          {copiedId === link.id ? <CheckCircle2 size={16} className="text-chart-2" /> : <Copy size={16} />}
                        </button>
                        <a 
                          href={link.finalUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
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
