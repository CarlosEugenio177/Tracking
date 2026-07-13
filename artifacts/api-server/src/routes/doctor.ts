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

// --- HEADLESS BROWSER EVENT INTERCEPTOR ---
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
    
    // Mask as a real browser, otherwise Facebook blocks tracking scripts from firing
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    const interceptedEvents: any[] = [];
    let isPageLoaded = false;

    // Intercept network requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const reqUrl = request.url();
      
      // Block navigation after initial load to prevent losing the page during clicks
      if (isPageLoaded && request.isNavigationRequest() && request.frame() === page.mainFrame()) {
         request.abort();
         return;
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

          // Filter out redundant automatic events
          if (eventName === 'SubscribedButtonClick') {
            return;
          }

          interceptedEvents.push({
            type: 'Facebook Pixel',
            eventName: eventName || 'Unknown',
            pixelId: pixelId || 'Unknown',
            url: reqUrl,
            timestamp: new Date().toISOString()
          });
        } catch (e) {}
      }
      
      // Check for Google Analytics/GTM requests
      if (reqUrl.includes('google-analytics.com/g/collect')) {
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
    } catch (e) {
      // Ignore errors if page structure breaks during aggressive clicks
    }
    
    // Wait for the click-triggered events to fire
    await new Promise(r => setTimeout(r, 3000));
    
    await browser.close();

    res.json({ success: true, events: interceptedEvents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to simulate visit" });
  }
});

export default router;
