import React from "react";
import { Link } from "wouter";
import { Target, Activity, Zap, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/30">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
            <Target size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">TrackFlow</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Entrar</Link>
          <Link href="/sign-up" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Começar grátis</Link>
        </div>
      </nav>

      <main>
        <section className="py-24 px-8 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap size={14} /> O GitHub do Rastreamento Digital
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-balance max-w-4xl mx-auto leading-tight">
            Pare de perder dados.<br />Comece a governá-los.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O cockpit operacional para times de marketing. Cada campanha, link, UTM, webhook e conversão em um único lugar. Rastreamento inviolável, ROI verificável.
          </p>
          <div className="pt-8">
            <Link href="/sign-up" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-medium rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98]">
              Começar agora <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        <section className="py-24 bg-card/30 border-t border-b border-border mt-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-semibold">Pipeline de Eventos ao Vivo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Acompanhe a jornada exata do clique ao lead e à venda em tempo real. Sem caixas pretas.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center text-chart-2">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-semibold">UTMs Padronizadas</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gere links invioláveis com taxonomia predefinida. Se não está governado, não roda.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-chart-5/10 flex items-center justify-center text-chart-5">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-semibold">ROAS Real Calculado</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ingerimos o webhook de receita exata e vinculamos ao primeiro clique. Zero estimativa.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
