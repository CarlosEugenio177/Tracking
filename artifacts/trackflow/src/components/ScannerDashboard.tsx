import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Activity, Search, Server, Settings, Zap, ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert, Globe, Clock, MessageSquare, Plus, Code, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScannerDashboard() {
  const [scanUrl, setScanUrl] = useState("https://inlead.digital/preview/agcveiculos-v1/");

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/doctor/simulate-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl }),
      });
      return response.json();
    },
  });

  const d = simulateMutation.data;
  const isPending = simulateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header Search Area */}
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="h-6 w-6 text-primary" />
            Tracking Observability
          </CardTitle>
          <CardDescription className="text-base">
            Insira a URL para executar o navegador fantasma e gerar o relatório Lighthouse de Tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Input 
                id="url" 
                placeholder="https://sua-landing-page.com" 
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <Button 
              onClick={() => simulateMutation.mutate()} 
              disabled={isPending || !scanUrl}
              className="h-12 px-8 text-lg font-semibold"
            >
              {isPending ? (
                <><Activity className="h-5 w-5 mr-2 animate-spin" /> Analisando 15s...</>
              ) : (
                "Gerar Diagnóstico"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isPending && (
        <Card className="bg-zinc-100 dark:bg-zinc-900 border-dashed border-2 p-12 text-center animate-pulse">
          <Activity className="h-16 w-16 mx-auto mb-6 text-primary animate-spin" />
          <h3 className="text-2xl font-bold mb-2">Simulando Visita...</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            O nosso robô está baixando o HTML, executando Javascript, caçando botões, simulando cliques e interceptando a placa de rede.
          </p>
        </Card>
      )}

      {/* Error State */}
      {d && !d.success && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na Análise</AlertTitle>
          <AlertDescription>{d.message}</AlertDescription>
        </Alert>
      )}

      {/* Results Dashboard */}
      {d && d.success && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
          
          {/* Top Row: Score & AI Insight */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="flex flex-col justify-center items-center p-6 bg-gradient-to-br from-card to-zinc-50 dark:to-zinc-900 border-2 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">Health Score</p>
                <div className={`text-7xl font-black tracking-tighter ${d.score >= 90 ? 'text-emerald-500' : d.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {d.score}
                </div>
                <p className="text-sm text-zinc-400 mt-2">/ 100 pontos</p>
              </div>
            </Card>
            
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Insight da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {d.ai_insight}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-500" />
                  Pixels Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm">Meta Pixel</span>
                  {d.pixels.facebook.length > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm">GTM</span>
                  {d.pixels.gtm ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs text-zinc-400">Não detectado</span>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Analytics</span>
                  {d.pixels.googleAnalytics ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs text-zinc-400">Não detectado</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Eventos (Conversões)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.events.length === 0 ? (
                  <p className="text-sm text-red-500 font-medium">Nenhum evento detectado.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(d.events.map((e: any) => e.eventName))).map((name: any, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-xs font-semibold">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500" />
                  Cookies Essenciais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.cookies.length === 0 ? (
                  <p className="text-sm text-red-500 font-medium">Nenhum cookie de tracking.</p>
                ) : (
                  d.cookies.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">{c.name}</span>
                      <span className="text-xs text-zinc-500 truncate max-w-[100px]" title={c.value}>{c.value}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                  Consentimento
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-20">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${d.consent === 'Detected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                  {d.consent}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Actionable Report */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-red-500/20 shadow-sm">
              <CardHeader className="bg-red-500/5 pb-4">
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Problemas Encontrados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {d.issues.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum problema grave.</p>
                ) : (
                  d.issues.map((iss: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold mt-0.5">•</span>
                      <span className="text-sm font-medium">{iss}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 shadow-sm">
              <CardHeader className="bg-emerald-500/5 pb-4">
                <CardTitle className="text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Plano de Ação (Sugestões)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {d.suggestions.length === 0 ? (
                  <p className="text-sm text-zinc-500">Tudo perfeito!</p>
                ) : (
                  d.suggestions.map((sug: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{sug}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline and Events */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Loading Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-6 pb-4 pt-2">
                  {d.timeline.map((item: any, i: number) => (
                    <div key={i} className="relative pl-6">
                      <span className="absolute -left-[5px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-card"></span>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-semibold">{item.type}</p>
                        </div>
                        <span className="text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                          {item.timeMs} ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Explorer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-orange-500" />
                  Network Event Explorer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {d.events.length === 0 ? (
                  <div className="text-center p-8 text-zinc-500 border border-dashed rounded-lg">
                    Nenhum evento capturado.
                  </div>
                ) : (
                  d.events.map((ev: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-2 hover:border-orange-500/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">{ev.type}</span>
                        <span className="text-xs font-mono text-zinc-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-orange-500/10 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          {ev.eventName}
                        </span>
                        <span className="bg-zinc-200 dark:bg-zinc-800 text-[10px] px-2 py-0.5 rounded font-mono truncate max-w-[150px]">
                          ID: {ev.pixelId || ev.measurementId}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          
        </div>
      )}
    </div>
  );
}
