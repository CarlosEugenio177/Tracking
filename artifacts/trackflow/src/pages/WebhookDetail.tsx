import React, { useState } from "react";
import { useGetWebhookEndpoint, useListWebhookEvents, useListWorkspaces, useResendWebhookEvent } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, RefreshCw, Copy, CheckCircle2, TerminalSquare, FileJson, Clock, Play } from "lucide-react";
import JsonView from '@uiw/react-json-view';

export default function WebhookDetail() {
  const params = useParams();
  const endpointId = parseInt(params.id || "0", 10);
  
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;

  const { data: endpoint, isLoading: endpointLoading } = useGetWebhookEndpoint(workspaceId, endpointId, { 
    query: { enabled: !!workspaceId && !!endpointId, queryKey: ["/api/workspaces", workspaceId, "webhooks", endpointId] } 
  });

  const { data: events, isLoading: eventsLoading, isRefetching: eventsRefetching, refetch: refetchEvents } = useListWebhookEvents(workspaceId, endpointId, {}, {
    query: { enabled: !!workspaceId && !!endpointId, queryKey: ["/api/workspaces", workspaceId, "webhooks", endpointId, "events"] }
  });

  const resendEvent = useResendWebhookEvent();
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  // State for Master-Detail view
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'payload' | 'headers'>('payload');

  const selectedEvent = events?.find((e: any) => e.id === selectedEventId);

  // Set first event as selected by default when loaded
  React.useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

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

  const getStatusTextClass = (status: string, code: number) => {
    if (status === 'processed' || (code >= 200 && code < 300)) return "text-chart-2";
    if (status === 'failed' || code >= 400) return "text-destructive";
    return "text-muted-foreground";
  };

  if (endpointLoading) {
    return <div className="animate-pulse space-y-6 h-full">
      <div className="h-20 bg-card rounded-xl border border-border"></div>
      <div className="h-96 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  // Common JSON View styling
  const jsonViewStyle = {
    backgroundColor: 'transparent',
    '--w-rjv-color': '#d4d4d4',
    '--w-rjv-key-string': '#9cdcfe',
    '--w-rjv-background-color': 'transparent',
    '--w-rjv-line-color': '#404040',
    '--w-rjv-arrow-color': '#808080',
    '--w-rjv-type-string-color': '#ce9178',
    '--w-rjv-type-int-color': '#b5cea8',
    '--w-rjv-type-float-color': '#b5cea8',
    '--w-rjv-type-boolean-color': '#569cd6',
    '--w-rjv-type-null-color': '#569cd6',
    '--w-rjv-type-undefined-color': '#569cd6',
  } as React.CSSProperties;

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 flex-shrink-0">
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

      {/* Info Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex-1 space-y-1 w-full overflow-hidden">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">URL de Ingestão</div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-md border border-border/50 truncate flex-1">
              {endpoint?.url}
            </code>
            <button 
              onClick={handleCopyUrl}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors font-medium text-sm flex-shrink-0"
            >
              {copiedUrl ? <><CheckCircle2 size={14} className="text-chart-2" /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
          </div>
        </div>
        <div className="hidden md:block w-px h-10 bg-border mx-4"></div>
        <div className="flex gap-8">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total de Eventos</div>
            <div className="text-lg font-bold font-mono">{endpoint?.totalEvents.toLocaleString('pt-BR') || 0}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Criado em</div>
            <div className="text-sm font-medium pt-0.5 text-foreground">
              {endpoint?.createdAt ? new Date(endpoint.createdAt).toLocaleDateString('pt-BR') : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Workspace */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-1 min-h-0">
        
        {/* Sidebar: Event List */}
        <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-border flex flex-col bg-muted/10">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TerminalSquare size={14} /> Histórico
            </h3>
            <button
              onClick={() => refetchEvents()}
              disabled={eventsRefetching}
              className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={12} className={eventsRefetching ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 divide-y divide-border/50 custom-scrollbar">
            {eventsLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
            ) : events?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs flex flex-col items-center">
                <TerminalSquare size={24} className="mb-2 opacity-20" />
                Nenhum evento recebido.
              </div>
            ) : (
              events?.map((event: any) => (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedEventId === event.id ? 'bg-muted border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${event.method === 'POST' ? 'bg-chart-5/10 text-chart-5' : 'bg-primary/10 text-primary'}`}>
                        {event.method}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(event.status || '', event.statusCode)}`}>
                        {event.statusCode}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground truncate">
                    {event.ip} • {event.origin || 'Origem Desconhecida'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Postman-like Viewer */}
        <div className="flex-1 flex flex-col bg-[#0d0d0d] text-zinc-300 min-w-0">
          {selectedEvent ? (
            <>
              {/* Toolbar Header */}
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#111] flex-shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className={`px-2 py-1 rounded text-xs font-bold font-mono ${selectedEvent.method === 'POST' ? 'bg-chart-5/20 text-chart-5' : 'bg-primary/20 text-primary'}`}>
                      {selectedEvent.method}
                    </div>
                    <div className="font-mono text-sm truncate text-zinc-400">
                       {endpoint?.url.replace(/^https?:\/\/[^\/]+/, '') || '/webhook'}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border border-zinc-700/50 flex items-center gap-1.5 bg-black/20 ${getStatusTextClass(selectedEvent.status || '', selectedEvent.statusCode)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(selectedEvent.status || '', selectedEvent.statusCode).split(' ')[0]}`}></span>
                      {selectedEvent.statusCode} {selectedEvent.status}
                    </div>
                </div>
                <button 
                  onClick={() => handleResend(selectedEvent.id)}
                  disabled={resendEvent.isPending}
                  className="bg-primary/90 text-primary-foreground hover:bg-primary px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-70 flex-shrink-0"
                >
                  <Play size={12} fill="currentColor" /> 
                  {resendEvent.isPending ? 'Reenviando...' : 'Replay'}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-zinc-800 bg-[#161616] px-2 pt-2 flex-shrink-0">
                <button 
                  onClick={() => setActiveTab('payload')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'payload' ? 'border-primary text-primary-foreground bg-[#0a0a0a] rounded-t-sm' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  <FileJson size={14} /> Payload
                </button>
                <button 
                  onClick={() => setActiveTab('headers')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'headers' ? 'border-primary text-primary-foreground bg-[#0a0a0a] rounded-t-sm' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  Headers
                </button>
              </div>

              {/* Viewer Area */}
              <div className="flex-1 overflow-auto p-4 bg-[#0a0a0a] custom-scrollbar">
                {activeTab === 'payload' && (
                  <div className="font-mono text-sm">
                    {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 ? (
                      <JsonView 
                        value={selectedEvent.payload as object} 
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={true}
                        style={jsonViewStyle}
                      />
                    ) : (
                      <div className="text-zinc-600 italic">Payload vazio ou não parseável.</div>
                    )}
                  </div>
                )}

                {activeTab === 'headers' && (
                  <div className="font-mono text-sm">
                     <JsonView 
                        value={selectedEvent.headers as object || {}} 
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={true}
                        style={jsonViewStyle}
                      />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-sm">
              <FileJson size={32} className="mb-3 opacity-20" />
              Selecione um evento no histórico<br/>para inspecionar seu conteúdo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
