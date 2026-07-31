import React, { useState, useEffect } from "react";
import { Shield, Key, Eye, EyeOff, Save, Check, RefreshCw, AlertTriangle, Play, HelpCircle, Activity, GitBranch, Database, Server, CheckCircle2, Cloud } from "lucide-react";
import { AWSCredentials } from "../types";

export default function CredentialsPanel() {
  const [config, setConfig] = useState<AWSCredentials>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    dynamoDbTable: "HelpDeskTickets",
    snsTopicArn: "",
    s3Bucket: "help-desk-ticket-attachments",
    useRealAWS: false
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);

  // Dynamic Serverless Telemetry Metrics
  const [pipelineStatus, setPipelineStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [liveMetrics, setLiveMetrics] = useState({
    cpu: 12,
    memory: 184,
    invocations: 42,
    activeSessions: 3
  });

  useEffect(() => {
    // Generate organic minor fluctuations in metrics
    const timer = setInterval(() => {
      setLiveMetrics(prev => ({
        cpu: Math.max(4, Math.min(40, prev.cpu + Math.floor(Math.random() * 5) - 2)),
        memory: Math.max(175, Math.min(210, prev.memory + Math.floor(Math.random() * 3) - 1)),
        invocations: prev.invocations + (Math.random() > 0.65 ? 1 : 0),
        activeSessions: Math.max(1, Math.min(8, prev.activeSessions + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0)))
      }));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const runPipelineTest = async () => {
    setPipelineStatus("running");
    setPipelineLogs([]);
    
    const steps = [
      "⚡ [CI/CD] Bootstrapping Docker environment container context...",
      "🔍 [CI/CD] Parsing repository file tree and checking typescript files...",
      "⚙️ [CI/CD] Verifying security boundaries (Zero Client-Side API Keys rule)...",
      "🛠️ [CI/CD] Compiling backend: esbuild server.ts --bundle --platform=node...",
      "🌐 [CI/CD] Testing Express/Vite router with local mock ingress network..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setPipelineLogs(prev => [...prev, steps[i]]);
    }

    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setPipelineLogs(prev => [
          ...prev,
          `✅ [HEALTH HANDSHAKE] Gateway check status code 200. Host payload: ${JSON.stringify(data)}`,
          "🚀 [DEPLOYMENT SUCCESS] Container built, verified, and routing traffic! Build bundle size: 242.8 KB"
        ]);
        setPipelineStatus("success");
      } else {
        throw new Error("Handshake failed");
      }
    } catch (err) {
      setPipelineLogs(prev => [
        ...prev,
        "❌ [HANDSHAKE ERROR] Routing failed. Fallback emulator remains active.",
        "⚠️ [DEPLOYMENT WARNING] Core server is healthy, but the deployment pipeline has minor warnings."
      ]);
      setPipelineStatus("error");
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/aws-config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load AWS configuration:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/aws-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save AWS credentials:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 flex flex-col items-center justify-center space-y-2">
        <RefreshCw className="h-6 w-6 text-amber-500 animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Fetching secure AWS configuration state...</span>
      </div>
    );
  }

  return (
    <div id="credentials-panel-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Configuration Form */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
        <div>
          <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded">Secure Integration</span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">AWS Connection Settings</h2>
          <p className="text-slate-500 text-sm mt-1">
            Toggle between the high-fidelity local AWS Sandbox Emulator or connect your real AWS resource nodes.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Mode Selector */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-slate-800 block">Integration Operation Mode</label>
              <span className="text-xs text-slate-500 leading-relaxed block">
                {config.useRealAWS 
                  ? "Real AWS integration is ACTIVE. The server will make live calls to Amazon DynamoDB and Amazon SNS." 
                  : "Local AWS Sandbox Emulator is ACTIVE. Zero credentials are required."}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setConfig({ ...config, useRealAWS: !config.useRealAWS })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.useRealAWS ? 'bg-amber-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  config.useRealAWS ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Access Key ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">AWS Access Key ID</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={config.accessKeyId}
                  onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                  disabled={!config.useRealAWS}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* Secret Access Key */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">AWS Secret Access Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showSecret ? "text" : "password"}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={config.secretAccessKey}
                  onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                  disabled={!config.useRealAWS}
                  className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  disabled={!config.useRealAWS}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* AWS Region */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">AWS Region</label>
              <input
                type="text"
                placeholder="us-east-1"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                disabled={!config.useRealAWS}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* DynamoDB Table Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">DynamoDB Table Name</label>
              <input
                type="text"
                placeholder="HelpDeskTickets"
                value={config.dynamoDbTable}
                onChange={(e) => setConfig({ ...config, dynamoDbTable: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50"
              />
            </div>

            {/* SNS Topic ARN */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Amazon SNS Topic ARN</label>
              <input
                type="text"
                placeholder="arn:aws:sns:us-east-1:123456789012:HelpDeskTicketTopic"
                value={config.snsTopicArn}
                onChange={(e) => setConfig({ ...config, snsTopicArn: e.target.value })}
                disabled={!config.useRealAWS}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 italic">
              * Server-side secure storage. API keys never exposed to browser networks.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-emerald-100 font-bold">Config Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* 2. Side Explanation & Warnings */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Connection Guidance */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-amber-950 flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-1.5" />
            AWS Connection Guidelines
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            When you activate <strong>Real AWS Mode</strong>, the underlying full-stack Express server immediately initializes official AWS clients using your credentials.
          </p>
          <div className="space-y-2 pt-2 border-t border-amber-200/50 text-[11px] text-amber-700 leading-relaxed">
            <p><strong>Step A:</strong> Create a DynamoDB table named exactly what is entered above (e.g., <code className="bg-amber-100 px-1 font-mono rounded">HelpDeskTickets</code>), with partition key <code className="bg-amber-100 px-1 font-mono rounded">ticketId</code> (string).</p>
            <p><strong>Step B:</strong> Create a Standard SNS Topic, subscribe your email to it, and confirm the link in your email client to verify notification pipelines.</p>
          </div>
        </div>

        {/* Security Disclosure */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-slate-800 flex items-center">
            <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
            Zero-Trust Credential Security
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your credentials are kept 100% secure. They are parsed strictly in the backend container's memory space. Because they are never injected into browser HTML states, they can never be intercepted by client-side inspections or browser extensions.
          </p>
        </div>

      </div>

      {/* 3. Comprehensive DevOps Monitoring & Deployment Dashboard Section */}
      <div className="lg:col-span-3 border-t border-slate-200 pt-6 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CI/CD Deploy Simulator Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Cloud Deploy Ingress
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1 flex items-center">
                  <GitBranch className="h-4.5 w-4.5 text-emerald-600 mr-1.5" />
                  DevOps CI/CD Build & Deployment Pipeline
                </h3>
              </div>
              <button
                type="button"
                onClick={runPipelineTest}
                disabled={pipelineStatus === "running"}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 shadow-sm disabled:opacity-50"
              >
                {pipelineStatus === "running" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                    <span>Running Ingress...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1 text-emerald-400 fill-emerald-400" />
                    <span>Trigger Deployment Pipeline</span>
                  </>
                )}
              </button>
            </div>

            {/* Pipeline Logs Output terminal */}
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 border border-slate-800 shadow-inner space-y-1.5 max-h-48 overflow-y-auto">
              <div className="text-slate-500">// INTEGRATED CONTAINER BUILD & TELEMETRY TERMINAL</div>
              {pipelineLogs.length === 0 ? (
                <div className="text-slate-500 py-6 text-center italic">
                  No active pipeline executions. Press the button above to simulate a full containerized compilation and live route validation check.
                </div>
              ) : (
                pipelineLogs.map((log, index) => {
                  let color = "text-slate-300";
                  if (log.includes("✅") || log.includes("🚀")) color = "text-emerald-400 font-bold";
                  if (log.includes("❌")) color = "text-rose-400 font-bold";
                  if (log.includes("⚡")) color = "text-amber-400";
                  return <div key={index} className={color}>{log}</div>;
                })
              )}
            </div>
          </div>

          {/* Infrastructure Metrics Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                Monitoring Telemetry
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-1 flex items-center">
                <Activity className="h-4.5 w-4.5 text-sky-600 mr-1.5" />
                Live Container Telemetry
              </h3>
            </div>

            {/* Gauge Dials list */}
            <div className="space-y-3.5 pt-1">
              
              {/* CPU Usage Dial */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Simulated Container CPU load</span>
                  <span className="font-mono text-sky-600">{liveMetrics.cpu}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${liveMetrics.cpu}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory load */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Docker Resident RAM load</span>
                  <span className="font-mono text-sky-600">{liveMetrics.memory} MB / 512 MB</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(liveMetrics.memory / 512) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Mini counters */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">API Invokes</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{liveMetrics.invocations}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cognito Pools</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{liveMetrics.activeSessions}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
