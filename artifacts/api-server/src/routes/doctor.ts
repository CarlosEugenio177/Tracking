import { Router, Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import puppeteer from "puppeteer-core";
import { z } from "zod";

const router = Router();

// Facebook CAPI Standard Event Schema approximation
const FacebookCAPISchema = z.object({
  data: z.array(
    z.object({
      event_name: z.string().min(1, "Event name is required (e.g. Purchase, PageView)"),
      event_time: z.number().int("Event time must be a unix timestamp in seconds"),
      action_source: z.enum(["email", "website", "phone_call", "chat", "physical_store", "system_generated", "other"], {
        errorMap: () => ({ message: "Action source must be one of: email, website, phone_call, chat, physical_store, system_generated, other" })
      }),
      user_data: z.object({
        em: z.union([z.string(), z.array(z.string())]).optional(),
        ph: z.union([z.string(), z.array(z.string())]).optional(),
        client_ip_address: z.string().optional(),
        client_user_agent: z.string().optional(),
        fbp: z.string().optional(),
        fbc: z.string().optional(),
      }).refine((data) => {
        // Must have at least one user data parameter
        return !!(data.em || data.ph || data.client_ip_address || data.fbp || data.fbc);
      }, "User data must contain at least one matching parameter (em, ph, client_ip_address, fbp, fbc)"),
      custom_data: z.record(z.any()).optional(),
    })
  ).min(1, "Data array must contain at least one event"),
});

router.post("/analyze", requireAuth(), (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = FacebookCAPISchema.safeParse(payload);
    
    if (result.success) {
      res.json({ valid: true, warnings: [], message: "Payload is valid for Facebook CAPI" });
    } else {
      const errors = result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      res.json({ valid: false, errors, message: "Payload validation failed" });
    }
  } catch (err) {
    res.status(500).json({ valid: false, errors: [{ path: "root", message: "Invalid JSON or server error" }] });
  }
});

router.post("/test-connection", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { pixelId, accessToken } = req.body;
    if (!pixelId || !accessToken) {
      res.status(400).json({ success: false, message: "Pixel ID and Access Token are required." });
      return;
    }

    // Ping the Facebook Graph API to verify the pixel and token
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    
    // We send a dummy GET or an empty POST to check authentication
    // A GET to /events is not allowed, but a POST with empty data will return a specific error if auth is valid,
    // or an auth error if invalid. Actually, getting the pixel itself is cleaner:
    const checkUrl = `https://graph.facebook.com/v19.0/${pixelId}?access_token=${accessToken}`;
    
    const response = await fetch(checkUrl);
    const data = await response.json();

    if (data.error) {
      res.json({ success: false, message: data.error.message, error: data.error });
    } else {
      res.json({ success: true, message: `Connection successful! Found Pixel: ${data.name || pixelId}`, data });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to reach Facebook API" });
  }
});

// --- EVENT CATCHER ---
// In-memory store for diagnostic events. 
// Key: sessionId (string), Value: Array of payloads
const testEventsStore = new Map<string, any[]>();

// Public endpoint to receive test webhooks
router.post("/webhook-test/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const payload = {
    receivedAt: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
  };

  const currentEvents = testEventsStore.get(sessionId) || [];
  // Keep only the last 50 events per session to avoid memory leaks
  if (currentEvents.length >= 50) currentEvents.shift();
  
  testEventsStore.set(sessionId, [...currentEvents, payload]);
  
  res.status(200).json({ success: true, message: "Test event received" });
});

// Authenticated endpoint to poll for received events
router.get("/webhook-events/:sessionId", requireAuth(), (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const events = testEventsStore.get(sessionId) || [];
  res.json({ success: true, events });
});

// --- URL SCANNER ---
router.post("/scan-url", requireAuth(), async (req: Request, res: Response) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    if (!url.startsWith("http")) url = "https://" + url;

    const response = await fetch(url);
    const html = await response.text();
    const baseUrl = new URL(url).origin;

    const results = {
      facebook: false,
      gtm: false,
      googleAnalytics: false,
      details: [] as string[]
    };

    const checkContent = (content: string, source: string) => {
      let found = false;
      if (content.match(/fbq\s*\(/) || content.match(/fbevents\.js/)) {
        results.facebook = true;
        results.details.push(`Facebook Pixel found in ${source}`);
        found = true;
      }
      if (content.match(/gtm\.js/) || content.match(/googletagmanager\.com\/gtm/)) {
        results.gtm = true;
        results.details.push(`GTM found in ${source}`);
        found = true;
      }
      if (content.match(/gtag\s*\(/) || content.match(/googletagmanager\.com\/gtag/)) {
        results.googleAnalytics = true;
        results.details.push(`Google Analytics found in ${source}`);
        found = true;
      }
      return found;
    };

    // Check main HTML
    checkContent(html, "Main HTML");

    // Extract JS chunks (React/Next.js SPA)
    const scriptRegex = /<script[^>]+src="([^">]+)"/g;
    let match;
    const jsUrls: string[] = [];

    while ((match = scriptRegex.exec(html)) !== null) {
      let scriptUrl = match[1];
      if (scriptUrl.startsWith("/")) scriptUrl = baseUrl + scriptUrl;
      if (!scriptUrl.startsWith("http")) continue;
      
      // Only fetch same-origin chunks or common known bundles to avoid fetching the entire internet
      if (scriptUrl.includes(new URL(url).hostname) || scriptUrl.includes("_next")) {
        jsUrls.push(scriptUrl);
      }
    }

    // Check up to 30 JS bundles (Next.js can have many chunks)
    const chunksToCheck = jsUrls.slice(0, 30);
    
    await Promise.all(chunksToCheck.map(async (chunkUrl) => {
      try {
        const chunkRes = await fetch(chunkUrl);
        const chunkJs = await chunkRes.text();
        checkContent(chunkJs, chunkUrl.split("/").pop() || chunkUrl);
      } catch (e) {
        // Ignore fetch errors
      }
    }));

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to scan URL" });
  }
});

// --- HEADLESS BROWSER EVENT INTERCEPTOR V2 ---
router.post("/simulate-visit", requireAuth(), async (req: Request, res: Response) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    if (!url.startsWith("http")) url = "https://" + url;

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    const startTime = performance.now();
    const timeline: any[] = [];
    const interceptedEvents: any[] = [];
    const issues: string[] = [];
    const suggestions: string[] = [];
    const pixels = { facebook: [] as string[], gtm: false, googleAnalytics: false, tiktok: false };
    
    let isPageLoaded = false;

    // We will track HTML and CSS loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const reqUrl = request.url();
      const resourceType = request.resourceType();
      const elapsed = Math.round(performance.now() - startTime);
      
      // Block navigation after initial load to prevent losing the page during clicks
      if (isPageLoaded && request.isNavigationRequest() && request.frame() === page.mainFrame()) {
         request.abort();
         return;
      }
      
      if (resourceType === 'document' && reqUrl === url) {
        timeline.push({ timeMs: elapsed, type: 'Document', name: 'HTML Document' });
      } else if (resourceType === 'stylesheet') {
        if (!timeline.find(t => t.type === 'CSS')) {
          timeline.push({ timeMs: elapsed, type: 'CSS', name: 'First Stylesheet' });
        }
      }
      
      // Check for Facebook Pixel requests
      if (reqUrl.includes('facebook.com/tr') || reqUrl.includes('facebook.com/signals')) {
        try {
          const urlObj = new URL(reqUrl);
          let eventName = urlObj.searchParams.get('ev');
          let pixelId = urlObj.searchParams.get('id');

          if (!eventName && request.method() === 'POST') {
            try {
              const body = request.postData();
              if (body) {
                const bodyParams = new URLSearchParams(body);
                eventName = bodyParams.get('ev') || eventName;
                pixelId = bodyParams.get('id') || pixelId;
              }
            } catch(e) {}
          }

          if (pixelId && !pixels.facebook.includes(pixelId)) {
            pixels.facebook.push(pixelId);
            timeline.push({ timeMs: elapsed, type: 'Pixel', name: `Meta Pixel (${pixelId})` });
          }

          // Filter out redundant automatic events
          if (eventName !== 'SubscribedButtonClick') {
            interceptedEvents.push({
              type: 'Facebook Pixel',
              eventName: eventName || 'Unknown',
              pixelId: pixelId || 'Unknown',
              url: reqUrl,
              timestamp: new Date().toISOString()
            });
            timeline.push({ timeMs: elapsed, type: 'Event', name: eventName || 'Unknown' });
          }
        } catch (e) {}
      }
      
      // Check for Google Analytics/GTM requests
      if (reqUrl.includes('googletagmanager.com/gtm.js')) {
         if (!pixels.gtm) {
           pixels.gtm = true;
           timeline.push({ timeMs: elapsed, type: 'TagManager', name: 'Google Tag Manager' });
         }
      }
      if (reqUrl.includes('google-analytics.com/g/collect')) {
        if (!pixels.googleAnalytics) {
          pixels.googleAnalytics = true;
          timeline.push({ timeMs: elapsed, type: 'Analytics', name: 'Google Analytics' });
        }
        try {
          const urlObj = new URL(reqUrl);
          const eventName = urlObj.searchParams.get('en') || 'Unknown';
          const measurementId = urlObj.searchParams.get('tid') || 'Unknown';
          interceptedEvents.push({
            type: 'Google Analytics',
            eventName,
            measurementId,
            url: reqUrl,
            timestamp: new Date().toISOString()
          });
          timeline.push({ timeMs: elapsed, type: 'Event', name: eventName || 'Unknown' });
        } catch (e) {}
      }
      
      request.continue();
    });

    // Go to URL and wait for network to be idle (up to 10 seconds)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    
    // Wait for initial tracking scripts to fire on load
    await new Promise(r => setTimeout(r, 3000));
    
    isPageLoaded = true; // Lock navigation

    // AGGRESSIVE MODE: Click all buttons and links blindly
    try {
      const clickables = await page.$$('button, a, [role="button"], input[type="submit"], input[type="button"]');
      for (const el of clickables) {
         await el.evaluate(b => {
             try { 
                 (b as HTMLElement).click(); 
             } catch(e) {}
         }).catch(() => {});
      }
    } catch (e) {}
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Extract Cookies
    const browserCookies = await page.cookies();
    const cookies = browserCookies.map(c => ({
      name: c.name,
      value: c.value.length > 20 ? c.value.substring(0, 20) + '***' : c.value,
      domain: c.domain,
      expires: c.expires
    })).filter(c => ['_fbp', '_fbc', '_ga', '_gid'].includes(c.name));

    // Extract Consent
    const consentMode = await page.evaluate(() => {
      // Very basic heuristic for consent
      if (typeof (window as any).google_tag_data !== 'undefined') return "Detected";
      if (document.cookie.includes('consent')) return "Cookie Found";
      return "Not Detected";
    });

    await browser.close();

    // -----------------------------------------
    // INTELLIGENT DIAGNOSTICS & HEURISTICS
    // -----------------------------------------
    let score = 100;
    
    const hasFB = pixels.facebook.length > 0;
    const fbEvents = interceptedEvents.filter(e => e.type === 'Facebook Pixel').map(e => e.eventName);
    
    if (pixels.facebook.length > 1) {
       issues.push("Pixel da Meta duplicado.");
       suggestions.push("Remova a instalação redundante do Pixel para evitar eventos duplicados e ROAS inflado.");
       score -= 15;
    }
    
    if (hasFB) {
      if (!fbEvents.includes('PageView')) {
        issues.push("O evento PageView não foi disparado.");
        suggestions.push("Verifique se o código base do Pixel da Meta está instalado corretamente no <head>.");
        score -= 20;
      }
      
      const conversionEvents = ['Lead', 'Purchase', 'AddToCart', 'InitiateCheckout', 'CompleteRegistration'];
      const hasConversion = fbEvents.some(e => conversionEvents.includes(e));
      
      if (!hasConversion) {
        issues.push("Nenhum evento de conversão detectado (ex: Lead, Purchase).");
        suggestions.push("O Pixel está instalado, mas as ações de valor não estão sendo rastreadas. Configure os eventos de conversão nos botões ou formulários.");
        score -= 20;
      }
      
      if (!cookies.find(c => c.name === '_fbp')) {
        issues.push("Cookie _fbp não encontrado.");
        suggestions.push("O cookie _fbp é essencial para Advanced Matching. Verifique se o First-Party Cookies está habilitado na configuração do Pixel.");
        score -= 10;
      }
    } else {
      issues.push("Pixel da Meta não encontrado.");
      suggestions.push("Instale o Meta Pixel caso você faça anúncios no Facebook/Instagram.");
      score -= 30;
    }
    
    if (pixels.gtm && !hasFB && !pixels.googleAnalytics) {
       issues.push("GTM encontrado, mas nenhuma tag de conversão disparou.");
       suggestions.push("O GTM está instalado, mas parece vazio. Configure as tags (Pixel/GA4) e ative os Acionadores (Triggers).");
       score -= 15;
    }

    // AI Insight generation
    let ai_insight = `Seu tracking está ${Math.max(0, score)}% saudável. `;
    if (score === 100) {
      ai_insight += "Excelente! Todos os sinais vitais estão funcionando perfeitamente. O seu funil está totalmente rastreado e pronto para escalar.";
    } else if (score >= 80) {
      ai_insight += `Existem ${issues.length} pequenos problemas. A fundação está boa, mas alguns ajustes finos podem melhorar a atribuição e reduzir a perda de dados.`;
    } else {
      ai_insight += `Existem ${issues.length} problemas críticos. ${issues[0]} Isso impede as plataformas de anúncios de otimizar campanhas adequadamente, o que está custando dinheiro.`;
    }

    res.json({ 
      success: true, 
      score: Math.max(0, score),
      pixels,
      events: interceptedEvents,
      cookies,
      consent: consentMode,
      timeline,
      issues,
      suggestions,
      ai_insight
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to simulate visit" });
  }
});

export default router;
