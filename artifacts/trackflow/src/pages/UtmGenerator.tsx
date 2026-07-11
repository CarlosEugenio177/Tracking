import React, { useState } from "react";
import { useGenerateUtm, useListWorkspaces } from "@workspace/api-client-react";
import { Wand2, Copy, CheckCircle2, Link as LinkIcon, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UtmGenerator() {
  const { data: workspaces } = useListWorkspaces({ query: { queryKey: ["/api/workspaces"] } });
  const workspaceId = workspaces?.[0]?.id || 1;
  const generateUtm = useGenerateUtm();
  const { toast } = useToast();

  const [form, setForm] = useState({
    baseUrl: "",
    platform: "",
    campaignName: "",
    creative: "",
    audience: "",
  });

  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.baseUrl || !form.platform || !form.campaignName) return;

    generateUtm.mutate({
      workspaceId,
      data: form
    }, {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (err) => {
        toast({ title: "Erro ao gerar link", variant: "destructive" });
      }
    });
  };

  const handleCopy = () => {
    if (result?.finalUrl) {
      navigator.clipboard.writeText(result.finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copiado para a área de transferência" });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerador de UTM Inteligente</h1>
        <p className="text-muted-foreground mt-1">Gere links de rastreamento padronizados instantaneamente.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de Destino *</label>
            <input 
              type="url" 
              required
              className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://exemplo.com/pagina-de-destino"
              value={form.baseUrl}
              onChange={e => setForm({...form, baseUrl: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Plataforma / Fonte *</label>
            <select 
              required
              className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.platform}
              onChange={e => setForm({...form, platform: e.target.value})}
            >
              <option value="" disabled>Selecione a plataforma</option>
              <option value="facebook">Meta / Facebook</option>
              <option value="google">Google Ads</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
              <option value="email">E-mail / Newsletter</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Campanha *</label>
            <input 
              type="text" 
              required
              className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ex.: Promo_Q3_Liquidacao"
              value={form.campaignName}
              onChange={e => setForm({...form, campaignName: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Criativo / Nome do Anúncio</label>
            <input 
              type="text" 
              className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ex.: Video_Depoimento_1"
              value={form.creative}
              onChange={e => setForm({...form, creative: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Público / Termo</label>
            <input 
              type="text" 
              className="w-full bg-input/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ex.: Retargeting_30d"
              value={form.audience}
              onChange={e => setForm({...form, audience: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={generateUtm.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generateUtm.isPending ? "Gerando..." : <><Wand2 size={16} /> Gerar Link</>}
          </button>
        </form>

        <div className="space-y-6">
          {result ? (
            <div className="bg-card p-6 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)] space-y-6 animate-in fade-in zoom-in duration-300">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <LinkIcon size={14} /> URL Gerada
                </h3>
                <div className="bg-background p-4 rounded-lg border border-border break-all font-mono text-sm leading-relaxed text-foreground select-all">
                  {result.finalUrl}
                </div>
                <button 
                  onClick={handleCopy}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors border border-border"
                >
                  {copied ? <><CheckCircle2 size={16} className="text-chart-2" /> Copiado!</> : <><Copy size={16} /> Copiar para Área de Transferência</>}
                </button>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Parâmetros</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">utm_source</div>
                  <div className="font-mono">{result.utmSource}</div>
                  <div className="text-muted-foreground">utm_medium</div>
                  <div className="font-mono">{result.utmMedium}</div>
                  <div className="text-muted-foreground">utm_campaign</div>
                  <div className="font-mono">{result.utmCampaign}</div>
                  {result.utmContent && (
                    <>
                      <div className="text-muted-foreground">utm_content</div>
                      <div className="font-mono">{result.utmContent}</div>
                    </>
                  )}
                  {result.utmTerm && (
                    <>
                      <div className="text-muted-foreground">utm_term</div>
                      <div className="font-mono">{result.utmTerm}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card/50 border border-border border-dashed rounded-xl h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <Target size={24} />
              </div>
              <h3 className="font-medium mb-2">Pronto para gerar</h3>
              <p className="text-sm text-muted-foreground">
                Preencha o formulário ao lado para gerar um link de rastreamento totalmente padronizado com parâmetros UTM formatados automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
