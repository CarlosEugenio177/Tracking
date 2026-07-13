import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Activity, Stethoscope, AlertTriangle, CheckCircle2, ShieldAlert, PlugZap, Link2, Radio, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

export default function Doctor() {
  const { toast } = useToast();
  
  // State for Payload Analyzer
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            user_data: {
              client_ip_address: "123.123.123.123",
            },
          },
        ],
      },
      null,
      2
    )
  );

  // State for Connection Tester
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // State for URL Scanner
  const [scanUrl, setScanUrl] = useState("https://inlead.digital/preview/agcveiculos-v1/");

  // State for Event Catcher
  const [sessionId] = useState(() => uuidv4().substring(0, 8));
  const [isListening, setIsListening] = useState(false);
  
  const webhookUrl = `${window.location.origin}/api/doctor/webhook-test/${sessionId}`;

  const analyzeMutation = useMutation({
    mutationFn: async (data: string) => {
      const response = await fetch("/api/doctor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(JSON.parse(data)),
      });
      return response.json();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to analyze payload. Invalid JSON?", variant: "destructive" });
    },
  });

  const connectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/doctor/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pixelId, accessToken }),
      });
      return response.json();
    },
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/doctor/scan-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl }),
      });
      return response.json();
    },
  });

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

  const { data: eventsData, refetch: fetchEvents } = useQuery({
    queryKey: ["webhook-events", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/doctor/webhook-events/${sessionId}`);
      return response.json();
    },
    enabled: isListening,
    refetchInterval: isListening ? 3000 : false,
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-blue-500" />
          Tracking Doctor
        </h2>
      </div>
      <p className="text-muted-foreground">
        Diagnose and debug your tracking webhooks, payload schemas, and API connections.
      </p>

      <Tabs defaultValue="payload" className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="payload" className="flex gap-2">
            <Activity className="h-4 w-4" />
            Payload Analyzer
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex gap-2">
            <PlugZap className="h-4 w-4" />
            Connection Health
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex gap-2">
            <Link2 className="h-4 w-4" />
            URL Scanner
          </TabsTrigger>
          <TabsTrigger value="catcher" className="flex gap-2">
            <Radio className="h-4 w-4" />
            Event Catcher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payload" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Payload</CardTitle>
                <CardDescription>
                  Paste your JSON payload here to validate it against the Facebook Conversions API standards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="font-mono h-[300px] resize-none"
                  placeholder="{ data: [...] }"
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => analyzeMutation.mutate(payload)}
                  disabled={analyzeMutation.isPending}
                  className="w-full"
                >
                  {analyzeMutation.isPending ? "Analyzing..." : "Analyze Payload"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Results</CardTitle>
                <CardDescription>Real-time feedback on missing fields or formatting issues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!analyzeMutation.data && !analyzeMutation.isPending && (
                  <div className="flex flex-col items-center justify-center h-[300px] text-zinc-500">
                    <Activity className="h-12 w-12 mb-4 opacity-20" />
                    <p>Run the analyzer to see results</p>
                  </div>
                )}
                
                {analyzeMutation.data?.valid && (
                  <Alert className="bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 !text-emerald-600 dark:!text-emerald-400" />
                    <AlertTitle>Perfect Payload</AlertTitle>
                    <AlertDescription>Your payload perfectly matches the CAPI specification.</AlertDescription>
                  </Alert>
                )}

                {analyzeMutation.data && !analyzeMutation.data.valid && (
                  <div className="space-y-3">
                    <Alert variant="destructive">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle>Validation Failed</AlertTitle>
                      <AlertDescription>We found issues in your payload structure.</AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-2">
                      {analyzeMutation.data.errors?.map((err: any, i: number) => (
                        <div key={i} className="flex gap-3 text-sm p-3 border rounded-md border-red-500/20 bg-red-500/5">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-red-500 block mb-1">Path: {err.path}</span>
                            <span className="text-zinc-400">{err.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connection" className="space-y-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Facebook CAPI Connection</CardTitle>
              <CardDescription>
                Test your Pixel ID and System User Access Token to ensure Facebook is accepting requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixel">Pixel ID / Dataset ID</Label>
                <Input 
                  id="pixel" 
                  placeholder="e.g. 123456789012345" 
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Access Token</Label>
                <Input 
                  id="token" 
                  type="password"
                  placeholder="EAAB..." 
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>

              {connectionMutation.data && (
                <div className="pt-4">
                  <Alert className={connectionMutation.data.success ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600" : "bg-red-500/10 border-red-500/50 text-red-500"}>
                    {connectionMutation.data.success ? (
                      <CheckCircle2 className="h-4 w-4 !text-emerald-600" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 !text-red-500" />
                    )}
                    <AlertTitle>{connectionMutation.data.success ? "Connection Active" : "Connection Failed"}</AlertTitle>
                    <AlertDescription className="break-all text-xs mt-2 font-mono">
                      {connectionMutation.data.message}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => connectionMutation.mutate()} 
                disabled={connectionMutation.isPending || !pixelId || !accessToken}
                className="w-full"
              >
                {connectionMutation.isPending ? "Testing Connection..." : "Test Connection"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="scanner" className="space-y-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>URL Scanner (Link Tester)</CardTitle>
              <CardDescription>
                Scan a website URL to detect installed tracking pixels (Facebook Pixel, GTM, Google Analytics).
                We will download the HTML and the Javascript bundles to look for tracking code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input 
                  id="url" 
                  placeholder="https://example.com" 
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                />
              </div>

              {scanMutation.data && scanMutation.data.success && (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center gap-2 ${scanMutation.data.data.facebook ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-zinc-100 dark:bg-zinc-900 border-dashed text-zinc-500'}`}>
                      {scanMutation.data.data.facebook ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                      <span className="font-medium text-sm">Facebook Pixel</span>
                    </div>
                    <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center gap-2 ${scanMutation.data.data.gtm ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600' : 'bg-zinc-100 dark:bg-zinc-900 border-dashed text-zinc-500'}`}>
                      {scanMutation.data.data.gtm ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                      <span className="font-medium text-sm">Google Tag Manager</span>
                    </div>
                    <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center gap-2 ${scanMutation.data.data.googleAnalytics ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-zinc-100 dark:bg-zinc-900 border-dashed text-zinc-500'}`}>
                      {scanMutation.data.data.googleAnalytics ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                      <span className="font-medium text-sm">Google Analytics</span>
                    </div>
                  </div>
                  
                  {scanMutation.data.data.details.length > 0 && (
                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-md p-4 mt-4">
                      <h4 className="font-semibold text-sm mb-2">Technical Details:</h4>
                      <ul className="text-xs space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
                        {scanMutation.data.data.details.map((detail: string, i: number) => (
                          <li key={i}>• {detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {scanMutation.data && !scanMutation.data.success && (
                 <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Scan Failed</AlertTitle>
                   <AlertDescription>{scanMutation.data.message}</AlertDescription>
                 </Alert>
              )}
              {simulateMutation.data && simulateMutation.data.success && (
                <div className="space-y-4 pt-4 border-t mt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Intercepted Browser Events
                  </h3>
                  
                  {simulateMutation.data.events.length === 0 ? (
                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-6 text-center border-dashed border-2">
                      <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                      <p className="text-zinc-500 text-sm">No tracking events were intercepted during the simulated visit.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {simulateMutation.data.events.map((event: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 border rounded-lg bg-card shadow-sm items-start">
                          {event.type === 'Facebook Pixel' ? (
                            <div className="bg-blue-500/10 p-2 rounded-md shrink-0">
                              <Activity className="h-6 w-6 text-blue-500" />
                            </div>
                          ) : (
                            <div className="bg-orange-500/10 p-2 rounded-md shrink-0">
                              <Activity className="h-6 w-6 text-orange-500" />
                            </div>
                          )}
                          <div className="space-y-1 w-full overflow-hidden">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-sm">{event.type}</h4>
                              <span className="text-xs text-zinc-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full font-medium">
                                Event: {event.eventName}
                              </span>
                              <span className="text-xs text-zinc-500 font-mono truncate">
                                ID: {event.pixelId || event.measurementId}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-mono truncate mt-2">{event.url}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {simulateMutation.data && !simulateMutation.data.success && (
                 <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Simulation Failed</AlertTitle>
                   <AlertDescription>{simulateMutation.data.message}</AlertDescription>
                 </Alert>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                onClick={() => scanMutation.mutate()} 
                disabled={scanMutation.isPending || simulateMutation.isPending || !scanUrl}
                className="flex-1"
                variant="outline"
              >
                {scanMutation.isPending ? "Scanning files..." : "Scan URL for Code"}
              </Button>
              <Button 
                onClick={() => simulateMutation.mutate()} 
                disabled={scanMutation.isPending || simulateMutation.isPending || !scanUrl}
                className="flex-1"
              >
                {simulateMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Simulating Visit...</> : "Simulate Visit & Intercept Events"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="catcher" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Event Catcher (Live Webhooks)</CardTitle>
                  <CardDescription>
                    Generate a temporary URL to receive and inspect incoming webhooks in real-time.
                  </CardDescription>
                </div>
                <Button 
                  variant={isListening ? "destructive" : "default"} 
                  onClick={() => setIsListening(!isListening)}
                  className="gap-2"
                >
                  {isListening ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Listening...</>
                  ) : (
                    <><Radio className="h-4 w-4" /> Start Listening</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                <div className="space-y-1 overflow-hidden">
                  <p className="text-sm font-medium text-zinc-500">Your unique test webhook URL:</p>
                  <p className="font-mono text-sm text-blue-500 truncate">{webhookUrl}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex justify-between items-center">
                  Incoming Events
                  <span className="bg-zinc-200 dark:bg-zinc-800 text-xs px-2 py-1 rounded-full">
                    {eventsData?.events?.length || 0} Events
                  </span>
                </h3>
                
                {!isListening && (!eventsData?.events || eventsData.events.length === 0) && (
                   <div className="text-center py-12 border-2 border-dashed rounded-lg text-zinc-500">
                     <Radio className="h-12 w-12 mx-auto mb-4 opacity-20" />
                     <p>Click "Start Listening" to begin capturing events</p>
                   </div>
                )}

                {isListening && (!eventsData?.events || eventsData.events.length === 0) && (
                   <div className="text-center py-12 border-2 border-dashed border-blue-500/20 rounded-lg text-blue-500/50">
                     <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                     <p>Waiting for webhooks...</p>
                     <p className="text-xs mt-2">Send a POST request to your unique URL.</p>
                   </div>
                )}

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {eventsData?.events?.slice().reverse().map((event: any, i: number) => (
                    <div key={i} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                      <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border-b flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold">{event.method}</span>
                          <span className="text-zinc-500">{new Date(event.receivedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="p-0">
                        <Textarea 
                          readOnly 
                          value={JSON.stringify(event.body, null, 2)} 
                          className="font-mono text-xs h-[150px] border-0 rounded-none resize-none focus-visible:ring-0 bg-black/5 dark:bg-black/40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
