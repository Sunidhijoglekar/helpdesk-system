import React, { useState, useEffect } from "react";
import { Terminal, Database, Send, RefreshCw, Layers, ShieldAlert, Cpu, Trash2, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import { CloudWatchLogEntry, APIGatewayLogEntry, SNSEmailNotification, Ticket } from "../types";

export default function AWSConsoleSimulator() {
  const [activeTab, setActiveTab] = useState<"cloudwatch" | "dynamodb" | "apigateway" | "sns">("cloudwatch");
  const [cwLogs, setCwLogs] = useState<CloudWatchLogEntry[]>([]);
  const [apgLogs, setApgLogs] = useState<APIGatewayLogEntry[]>([]);
  const [snsLogs, setSnsLogs] = useState<SNSEmailNotification[]>([]);
  const [dbTickets, setDbTickets] = useState<Ticket[]>([]);
  const [selectedTicketJson, setSelectedTicketJson] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(true);

  const fetchAWSLogs = async () => {
    try {
      const res = await fetch("/api/aws-logs");
      if (res.ok) {
        const data = await res.json();
        setCwLogs(data.cloudWatchLogs || []);
        setApgLogs(data.apiGatewayLogs || []);
        setSnsLogs(data.snsEmails || []);
      }
    } catch (err) {
      console.error("Failed to poll AWS logs:", err);
    }
  };

  const fetchDynamoDBTable = async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setDbTickets(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch DynamoDB table:", err);
    }
  };

  const clearCloudWatch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aws-logs", { method: "DELETE" });
      if (res.ok) {
        setCwLogs([]);
        setApgLogs([]);
        setSnsLogs([]);
        setDbTickets([]);
        setSelectedTicketJson(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAWSLogs();
    fetchDynamoDBTable();

    if (!isLive) return;

    const interval = setInterval(() => {
      fetchAWSLogs();
      fetchDynamoDBTable();
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div id="aws-simulator-container" className="bg-[#1e222b] rounded-xl overflow-hidden shadow-2xl border border-slate-800 text-slate-100">
      
      {/* AWS Console Style Header */}
      <div className="bg-[#16191f] px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-xs tracking-wider">AWS</div>
          <div className="flex items-center space-x-1">
            <span className="font-bold text-xs text-white">Management Console</span>
            <ChevronRight className="h-3 w-3 text-slate-500" />
            <span className="text-xs text-slate-300 font-medium">Serverless Help Desk Infrastructure Sandbox</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-2 md:mt-0">
          <div className="flex items-center space-x-1.5 bg-[#2a303c] border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className="text-slate-300 font-mono text-[10px] uppercase font-bold">{isLive ? "Live Syncing" : "Paused"}</span>
          </div>
          
          <button
            onClick={() => setIsLive(!isLive)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-semibold transition-colors"
          >
            {isLive ? "Pause" : "Resume"}
          </button>

          <button
            onClick={() => {
              fetchAWSLogs();
              fetchDynamoDBTable();
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white p-1 rounded transition-colors"
            title="Force Reload CloudWatch logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={clearCloudWatch}
            disabled={loading}
            className="bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-900/50 px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: AWS Side Rail and Output Screen */}
      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
        
        {/* Left Side Navigation - Styled like AWS Console Services menu */}
        <div className="md:col-span-1 bg-[#16191f]/60 p-4 border-r border-slate-800/80 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-2">Services in Scope</span>
            
            <button
              onClick={() => setActiveTab("cloudwatch")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                activeTab === "cloudwatch"
                  ? "bg-amber-500/10 border-l-2 border-amber-500 text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Terminal className="h-4 w-4 text-orange-400" />
              <span>CloudWatch Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("dynamodb")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                activeTab === "dynamodb"
                  ? "bg-amber-500/10 border-l-2 border-amber-500 text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Database className="h-4 w-4 text-cyan-400" />
              <span>DynamoDB Tables</span>
            </button>

            <button
              onClick={() => setActiveTab("apigateway")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                activeTab === "apigateway"
                  ? "bg-amber-500/10 border-l-2 border-amber-500 text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Layers className="h-4 w-4 text-purple-400" />
              <span>API Gateway Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("sns")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                activeTab === "sns"
                  ? "bg-amber-500/10 border-l-2 border-amber-500 text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Send className="h-4 w-4 text-emerald-400" />
              <span>SNS Alerts Queue</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-2 leading-relaxed">
            <span className="font-bold text-slate-400 block">Console Instructions:</span>
            <p>Every ticket submission, dispatch update, priority escalation, or administrative deletion triggers simulated or live AWS workflows.</p>
            <p>Select any service on the left to inspect raw runtime JSON documents, API latency traces, and SNS email queues.</p>
          </div>
        </div>

        {/* Right Side Console Viewer */}
        <div className="md:col-span-3 p-6 bg-[#1b1f27] flex flex-col h-full max-h-[600px] overflow-y-auto">
          
          {/* 1. CloudWatch Stream */}
          {activeTab === "cloudwatch" && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Log Group: /aws/lambda/HelpDeskTicketService</h3>
                  <p className="text-[11px] text-slate-500">Showing standard console output (stdout) for triggered AWS Lambda handlers.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{cwLogs.length} Streams Captured</span>
              </div>

              {cwLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <Terminal className="h-8 w-8 text-slate-600 animate-pulse" />
                  <p className="text-xs font-mono">Waiting for serverless execution streams...</p>
                  <p className="text-[10px] text-slate-600 max-w-xs text-center">Submit, assign, or status-update a ticket in the portals to generate CloudWatch records.</p>
                </div>
              ) : (
                <div className="bg-[#11141a] rounded-lg p-4 font-mono text-xs overflow-x-auto space-y-2 border border-slate-800 max-h-[450px]">
                  {cwLogs.map((log) => {
                    let levelColor = "text-sky-400";
                    if (log.level === "WARN") levelColor = "text-amber-400";
                    if (log.level === "ERROR") levelColor = "text-rose-400";

                    let serviceBadge = "bg-rose-950/50 text-rose-300 border-rose-900";
                    if (log.service === "DynamoDB") serviceBadge = "bg-cyan-950/50 text-cyan-300 border-cyan-900";
                    if (log.service === "API Gateway") serviceBadge = "bg-purple-950/50 text-purple-300 border-purple-900";
                    if (log.service === "SNS") serviceBadge = "bg-emerald-950/50 text-emerald-300 border-emerald-900";

                    return (
                      <div key={log.id} className="border-b border-slate-800/40 pb-2 last:border-b-0">
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                          <span>[{log.timestamp}]</span>
                          <span className={`px-1.5 border rounded ${serviceBadge} text-[9px]`}>{log.service}</span>
                          <span className={`font-bold ${levelColor}`}>{log.level}</span>
                        </div>
                        <p className="text-slate-300 mt-1 leading-relaxed">{log.message}</p>
                        {log.payload && (
                          <pre className="text-[9px] text-slate-500 bg-slate-900/60 p-2 rounded mt-1.5 max-h-40 overflow-y-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. DynamoDB Table Viewer */}
          {activeTab === "dynamodb" && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Table: HelpDeskTickets</h3>
                  <p className="text-[11px] text-slate-500">Viewing persistent NoSQL items. Click eye icon to display raw JSON DynamoDB document structures.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">DynamoDB Partition Key: ticketId (String)</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Tables list */}
                <div className="lg:col-span-5 border border-slate-800 bg-[#14171f] rounded-lg p-2.5 max-h-[400px] overflow-y-auto space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 px-1">Items Scanned</div>
                  {dbTickets.length === 0 ? (
                    <p className="text-xs text-slate-600 italic p-3 text-center">No records in database table.</p>
                  ) : (
                    dbTickets.map((tkt) => (
                      <button
                        key={tkt.ticketId}
                        onClick={() => setSelectedTicketJson(tkt)}
                        className={`w-full flex items-center justify-between p-2 rounded text-left transition-all ${
                          selectedTicketJson?.ticketId === tkt.ticketId
                            ? "bg-cyan-500/10 border border-cyan-800/80 text-cyan-300"
                            : "hover:bg-slate-800/50 border border-transparent text-slate-400"
                        }`}
                      >
                        <div className="text-xs font-mono">
                          <span className="font-bold block text-slate-200">{tkt.ticketId}</span>
                          <span className="text-[10px] text-slate-500">{tkt.employeeName} ({tkt.priority})</span>
                        </div>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    ))
                  )}
                </div>

                {/* JSON Display */}
                <div className="lg:col-span-7 bg-[#11141a] border border-slate-800 rounded-lg p-4 font-mono text-xs flex flex-col justify-between min-h-[300px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-2">// DYNAMODB RAW JSON ITEM SCHEMA</span>
                    {selectedTicketJson ? (
                      <pre className="text-[11px] text-emerald-400 leading-relaxed overflow-x-auto max-h-[320px]">
                        {JSON.stringify(selectedTicketJson, null, 2)}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                        <Database className="h-6 w-6 mb-2" />
                        <span className="text-xs">Select a DynamoDB item on the left to query and view its structured attributes.</span>
                      </div>
                    )}
                  </div>
                  {selectedTicketJson && (
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                      <span>Partition Key value: <strong className="text-slate-300">{selectedTicketJson.ticketId}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. API Gateway Trace Logs */}
          {activeTab === "apigateway" && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Amazon API Gateway Access Log Traces</h3>
                  <p className="text-[11px] text-slate-500">Inspecting HTTP route mappings, latency timings, and origin IP handshakes.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Stage: Development / Production</span>
              </div>

              {apgLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <Layers className="h-8 w-8 text-slate-600 animate-pulse" />
                  <p className="text-xs font-mono">No API Gateway traffic detected...</p>
                </div>
              ) : (
                <div className="bg-[#11141a] rounded-lg border border-slate-800 overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-900 px-4 py-2 text-[10px] font-mono font-bold text-slate-400 border-b border-slate-800 uppercase">
                    <div className="col-span-3">Timestamp</div>
                    <div className="col-span-2">Method</div>
                    <div className="col-span-3">Endpoint</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Latency</div>
                  </div>
                  <div className="divide-y divide-slate-800/50 max-h-[350px] overflow-y-auto">
                    {apgLogs.map((log) => {
                      let statusColor = "text-emerald-400 bg-emerald-950/30";
                      if (log.statusCode >= 400) statusColor = "text-rose-400 bg-rose-950/30";

                      return (
                        <div key={log.id} className="grid grid-cols-12 px-4 py-2.5 font-mono text-xs items-center hover:bg-slate-800/10">
                          <div className="col-span-3 text-slate-500 text-[10px]">{log.timestamp.split("T")[1].substring(0, 8)}</div>
                          <div className="col-span-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.method === 'GET' ? 'bg-sky-950/50 text-sky-400' :
                              log.method === 'POST' ? 'bg-emerald-950/50 text-emerald-400' :
                              log.method === 'DELETE' ? 'bg-red-950/50 text-red-400' : 'bg-amber-950/50 text-amber-400'
                            }`}>
                              {log.method}
                            </span>
                          </div>
                          <div className="col-span-3 text-slate-300 text-[11px] truncate">{log.path}</div>
                          <div className="col-span-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border border-slate-800 ${statusColor}`}>
                              {log.statusCode}
                            </span>
                          </div>
                          <div className="col-span-2 text-right text-amber-400 text-[11px] font-bold">{log.latencyMs}ms</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. SNS Delivery Status */}
          {activeTab === "sns" && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Amazon SNS Notification Queue (Email Outbox)</h3>
                  <p className="text-[11px] text-slate-500">Every SNS Topic trigger pushes messages dynamically. Read outbound employee alerting records below.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Subscribers: Active (Protocol: Email)</span>
              </div>

              {snsLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <Send className="h-8 w-8 text-slate-600 animate-pulse" />
                  <p className="text-xs font-mono">SNS Notification Queue empty...</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto">
                  {snsLogs.map((email) => (
                    <div key={email.id} className="bg-[#11141a] rounded-lg border border-slate-800 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 text-[10px] font-mono text-slate-500">
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-400 flex items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            DELIVERED VIA SNS
                          </span>
                          <span>•</span>
                          <span>ID: {email.snsMessageId}</span>
                        </div>
                        <span>{new Date(email.timestamp).toLocaleString()}</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex text-slate-400">
                          <span className="w-20 font-bold">To Address:</span>
                          <span className="text-sky-400 font-semibold">{email.recipientEmail}</span>
                        </div>
                        <div className="flex text-slate-400">
                          <span className="w-20 font-bold">Topic Arn:</span>
                          <span className="font-mono text-[10px] text-slate-500 truncate">arn:aws:sns:us-east-1:123456789012:HelpDeskTicketTopic</span>
                        </div>
                        <div className="flex text-slate-300">
                          <span className="w-20 font-bold">Subject:</span>
                          <span className="font-bold text-slate-200">{email.subject}</span>
                        </div>
                      </div>

                      <div className="bg-[#161a23] border border-slate-800 p-3 rounded font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                        {email.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
