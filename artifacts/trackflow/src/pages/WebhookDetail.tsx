import React, { useState } from "react";
import { useGetWebhookEndpoint, useListWebhookEvents, useListWorkspaces, useResendWebhookEvent } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, RefreshCw, Copy, CheckCircle2, TerminalSquare } from "lucide-react";

export default function WebhookDetail() {
  const params = useParams();
  const endpointId = parseInt(params.id || "0", 10);
  
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;

  const { data: endpoint, isLoading: endpointLoading } = useGetWebhookEndpoint(workspaceId, endpointId, { 
    query: { enabled: !!workspaceId && !!endpointId, queryKey: ["/api/workspaces", workspaceId, "webhooks", endpointId] } 
  });

  const { data: events, isLoading: eventsLoading } = useListWebhookEvents(workspaceId, endpointId, {}, {
    query: { enabled: !!workspaceId && !!endpointId, queryKey: ["/api/workspaces", workspaceId, "webhooks", endpointId, "events"] }
  });

  const resendEvent = useResendWebhookEvent();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const handleCopyUrl = () => {
    if (endpoint?.url) {
      navigator.clipboard.writeText(endpoint.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleResend = (eventId: number) => {
    resendEvent.mutate({ workspaceId, endpointId, eventId });
  };

  const getStatusColor = (status: string, code: number) => {
    if (status === 'processed' || (code >= 200 && code < 300)) return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    if (status === 'failed' || code >= 400) return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  if (endpointLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-20 bg-card rounded-xl border border-border"></div>
      <div className="h-96 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/webhooks" className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {endpoint?.name}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2 border border-chart-2/20">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" /> Ativo
            </span>
          </h1>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1 w-full overflow-hidden">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL de Ingestão</div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-3 py-2 rounded-md border border-border/50 truncate flex-1">
              {endpoint?.url}
            </code>
            <button 
              onClick={handleCopyUrl}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors font-medium text-sm flex-shrink-0"
            >
              {copiedUrl ? <><CheckCircle2 size={16} className="text-chart-2" /> Copiado</> : <><Copy size={16} /> Copiar</>}
            </button>
          </div>
        </div>
        <div className="hidden md:block w-px h-12 bg-border mx-4"></div>
        <div className="flex gap-8">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total de Eventos</div>
            <div className="text-xl font-bold font-mono">{endpoint?.totalEvents.toLocaleString('pt-BR') || 0}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Criado em</div>
            <div className="text-sm font-medium pt-1 text-foreground">
              {endpoint?.createdAt ? new Date(endpoint.createdAt).toLocaleDateString('pt-BR') : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <TerminalSquare size={16} /> Logs de Requisição
          </h3>
          <button className="text-xs font-medium flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
        
        <div className="divide-y divide-border overflow-x-auto">
          {eventsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando logs...</div>
          ) : events?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
              <TerminalSquare size={32} className="opacity-20 mb-3" />
              <p>Nenhuma requisição recebida ainda.</p>
              <p className="text-sm mt-1">Envie uma requisição POST para a URL de ingestão para vê-la aparecer aqui.</p>
            </div>
          ) : (
            events?.map((event) => (
              <div key={event.id} className="group">
                <div 
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                >
                  <div className={`px-2 py-1 rounded text-xs font-bold font-mono ${event.method === 'POST' ? 'bg-chart-5/10 text-chart-5' : 'bg-primary/10 text-primary'}`}>
                    {event.method}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status || '', event.statusCode)}`}>
                    {event.statusCode} {event.status}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground flex-1 truncate">
                    {event.ip || 'IP Desconhecido'} {event.origin ? `• ${event.origin}` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {new Date(event.timestamp).toLocaleString('pt-BR')}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleResend(event.id); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    title="Reenviar Evento"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                
                {expandedEvent === event.id && (
                  <div className="p-4 bg-[#050505] border-t border-border font-mono text-xs overflow-x-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground font-medium">Cabeçalhos</span>
                    </div>
                    <pre className="text-chart-3 mb-6 bg-black p-3 rounded border border-zinc-800/50">
                      {JSON.stringify(event.headers, null, 2)}
                    </pre>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground font-medium">Payload</span>
                    </div>
                    <pre className="text-chart-2 bg-black p-3 rounded border border-zinc-800/50">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
