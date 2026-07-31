import React, { useState } from "react";
import { Copy, Check, Server, Shield, Database, Send, HelpCircle, HardDrive, Cpu, Terminal, FileText, Briefcase, GitBranch, Key } from "lucide-react";

export default function DocumentationTab() {
  const [activeSubTab, setActiveSubTab] = useState<string>("architecture");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sampleIamPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/HelpDeskTickets"
    },
    {
      "Sid": "SNSAccess",
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:HelpDeskTicketTopic"
    }
  ]
}`;

  return (
    <div id="doc-tab-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 space-y-1 h-fit">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">Portfolio Sections</h3>
        <button
          onClick={() => setActiveSubTab("architecture")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === "architecture"
              ? "bg-amber-50 text-amber-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>System Architecture</span>
        </button>
        <button
          onClick={() => setActiveSubTab("database")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === "database"
              ? "bg-amber-50 text-amber-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>NoSQL DB Design</span>
        </button>
        <button
          onClick={() => setActiveSubTab("api")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === "api"
              ? "bg-amber-50 text-amber-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>API Specifications</span>
        </button>
        <button
          onClick={() => setActiveSubTab("security")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === "security"
              ? "bg-amber-50 text-amber-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Security & IAM Policy</span>
        </button>
        <button
          onClick={() => setActiveSubTab("deployment")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === "deployment"
              ? "bg-amber-50 text-amber-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Server className="h-4 w-4" />
          <span>AWS Deployment Guide</span>
        </button>
        <button
          onClick={() => setActiveSubTab("resume")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === "resume"
              ? "bg-amber-50 text-amber-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Resume & GitHub Bio</span>
        </button>
      </div>

      {/* Detail Area */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Sub-tab 1: Architecture */}
        {activeSubTab === "architecture" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded">AWS Serverless Design</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">Interactive Architecture Overview</h2>
              <p className="text-slate-500 text-sm mt-1">
                A decoupled, fully-event driven, high-availability ticket dispatch system that scales to zero when idle.
              </p>
            </div>

            {/* Interactive Visual AWS Flow */}
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center space-y-4">
              <span className="text-xs text-slate-400 font-mono">INTEGRATED SERVERLESS PATHWAY</span>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center w-full max-w-2xl text-center">
                
                {/* 1. Client App */}
                <div className="bg-white border-2 border-slate-200 rounded-lg p-3 shadow-xs hover:border-amber-400 transition-colors">
                  <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">React Client</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">S3 + CloudFront</p>
                </div>

                <div className="text-slate-400 font-mono text-xs flex justify-center py-2">➜</div>

                {/* 2. API Gateway */}
                <div className="bg-white border-2 border-orange-200 rounded-lg p-3 shadow-xs hover:border-orange-400 transition-colors">
                  <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Server className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">API Gateway</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">REST Endpoints</p>
                </div>

                <div className="text-slate-400 font-mono text-xs flex justify-center py-2">➜</div>

                {/* 3. AWS Lambda */}
                <div className="bg-white border-2 border-rose-200 rounded-lg p-3 shadow-xs hover:border-rose-400 transition-colors">
                  <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">AWS Lambda</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Node Compute</p>
                </div>

              </div>

              <div className="text-slate-400 font-mono text-xs py-1">⬇ (Triggers & Writes)</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-md">
                {/* DynamoDB */}
                <div className="bg-white border-2 border-cyan-200 rounded-lg p-4 text-center shadow-xs hover:border-cyan-400 transition-colors">
                  <div className="h-10 w-10 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Database className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">Amazon DynamoDB</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    NoSQL persistent store. Highly-optimized single-table design using ticketId partition keys.
                  </p>
                </div>

                {/* SNS Topic */}
                <div className="bg-white border-2 border-emerald-200 rounded-lg p-4 text-center shadow-xs hover:border-emerald-400 transition-colors">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Send className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">Amazon SNS</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Event topic sending real-time ticket creation, status update, and assignment emails.
                  </p>
                </div>
              </div>
            </div>

            {/* AWS Services Explanation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Serverless Services Explained</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition-colors">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                    Amazon API Gateway
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Acts as the front-door router. Receives HTTPS REST requests, parses incoming payloads, verifies query params, and safely triggers the respective microservice Lambda handler.
                  </p>
                </div>
                <div className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition-colors">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                    AWS Lambda Functions
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Zero-server compute runtime. Excels in rapid parallel spin-ups. We deploy specific handlers for creation, updates, engineer dispatching, and deletions, paying only when executed.
                  </p>
                </div>
                <div className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition-colors">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></span>
                    Amazon DynamoDB
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    A fully-managed NoSQL key-value database guaranteeing single-digit millisecond latency. Utilizes auto-partitioning scaling to handle unbounded amounts of tickets seamlessly.
                  </p>
                </div>
                <div className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition-colors">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                    Amazon SNS (Simple Notification Service)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Pub/Sub engine to broadcast messaging. Whenever priority shifts, state transitions, or assignments occur, Lambda instantly triggers SNS to push formatted emails to subscribers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Database Design */}
        {activeSubTab === "database" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div>
              <span className="bg-cyan-100 text-cyan-800 text-xs font-semibold px-2.5 py-1 rounded">NoSQL Single-Table Scheme</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">DynamoDB Table Specification</h2>
              <p className="text-slate-500 text-sm mt-1">
                Optimized key structures to maintain rapid search, filter, and individual ticket item retrieval.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Attribute</th>
                    <th className="px-4 py-3 font-semibold">NoSQL Type</th>
                    <th className="px-4 py-3 font-semibold">Key/Index Role</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-bold font-mono text-slate-700">ticketId</td>
                    <td className="px-4 py-3 font-mono text-sky-600">String (S)</td>
                    <td className="px-4 py-3"><span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded">PARTITION KEY</span></td>
                    <td className="px-4 py-3">Auto-generated string tracking individual tickets. E.g., `TKT-4128`</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-slate-700">employeeName</td>
                    <td className="px-4 py-3 font-mono text-sky-600">String (S)</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3">Full name of the submitting corporate worker.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-slate-700">employeeEmail</td>
                    <td className="px-4 py-3 font-mono text-sky-600">String (S)</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3">Primary email for confirmation and SNS alerts.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-slate-700">priority</td>
                    <td className="px-4 py-3 font-mono text-sky-600">String (S)</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3">Ticket priority: `Low`, `Medium`, `High`, `Critical`.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-slate-700">status</td>
                    <td className="px-4 py-3 font-mono text-sky-600">String (S)</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3">Workflow state: `Open`, `Assigned`, `In Progress`, `Resolved`, `Closed`.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-slate-700">history</td>
                    <td className="px-4 py-3 font-mono text-sky-600">List (L)</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3">JSON array embedding complete lifecycle logs (Date, Actor, Action, Details).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">NoSQL Single-Table Design Justification</h4>
              <p className="text-xs text-slate-500 leading-relaxed space-y-2">
                Instead of normal relational tables (separating tickets, history, and notes), we employ NoSQL single-item denormalization. By appending log histories into a DynamoDB <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600 font-mono">List</code> attribute directly inside the parent Ticket, we fetch all ticket data in a single rapid round-trip <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600 font-mono">GetItem</code>, avoiding complex SQL JOIN latency and significantly reducing Read Capacity Unit (RCU) expenditures.
              </p>
            </div>
          </div>
        )}

        {/* Sub-tab 3: API Specs */}
        {activeSubTab === "api" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div>
              <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded">API Gateway Specifications</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">REST API Endpoints</h2>
              <p className="text-slate-500 text-sm mt-1">
                Complete system API specs handled by Lambda integration.
              </p>
            </div>

            <div className="space-y-4">
              {/* Endpoint 1 */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">POST</span>
                    <span className="font-mono text-xs text-slate-700 font-semibold">/tickets</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">CREATE_TKT_LAMBDA</span>
                </div>
                <div className="p-4 text-xs space-y-2 bg-slate-50/20">
                  <p className="text-slate-600 font-medium">Creates a new Support Ticket, saves to DynamoDB, and broadcasts confirmation via SNS email.</p>
                  <p className="font-bold text-slate-700">Request Body:</p>
                  <pre className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] overflow-x-auto">
{`{
  "employeeName": "Alice Vance",
  "employeeEmail": "alice.vance@company.com",
  "department": "Engineering",
  "category": "Software Access",
  "subject": "Adobe Creative Cloud license expired",
  "description": "Please activate standard creative suit for layout editing.",
  "priority": "High"
}`}
                  </pre>
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-sky-500 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">GET</span>
                    <span className="font-mono text-xs text-slate-700 font-semibold">/tickets</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">LIST_TKT_LAMBDA</span>
                </div>
                <div className="p-4 text-xs space-y-2 bg-slate-50/20">
                  <p className="text-slate-600 font-medium">Lists all support tickets currently tracked inside Amazon DynamoDB via Scan API.</p>
                </div>
              </div>

              {/* Endpoint 3 */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">PUT</span>
                    <span className="font-mono text-xs text-slate-700 font-semibold">/tickets/{"{id}"}/assign</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ASSIGN_TKT_LAMBDA</span>
                </div>
                <div className="p-4 text-xs space-y-2 bg-slate-50/20">
                  <p className="text-slate-600 font-medium">Assigns a specified Support Engineer, logs history tracking details, and alerts employee via SNS email.</p>
                  <pre className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] overflow-x-auto">
{`{
  "assignedTo": "Sarah Jenkins (Support L2)",
  "actor": "Admin Supervisor"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 4: Security */}
        {activeSubTab === "security" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div>
              <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded">Least Privilege Policy</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">IAM Role Configuration Guidance</h2>
              <p className="text-slate-500 text-sm mt-1">
                Enforcing the principle of least privilege ensures Lambda execution roles only read/write to specified tables.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">AWS IAM USER / SERVICE ROLE INLINE POLICY JSON</span>
                <button
                  onClick={() => handleCopy(sampleIamPolicy, "iam-policy")}
                  className="flex items-center space-x-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium bg-amber-50 hover:bg-amber-100/50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {copiedText === "iam-policy" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied Policy!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy IAM Policy</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 shadow-sm">
                {sampleIamPolicy}
              </pre>

              <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl space-y-2">
                <h4 className="text-sm font-semibold text-amber-800 flex items-center">
                  <Shield className="h-4 w-4 mr-1.5" />
                  DevOps Production Best Practices
                </h4>
                <ul className="list-disc list-inside text-xs text-amber-700 space-y-1.5 leading-relaxed">
                  <li><strong>No Wildcard Databases:</strong> Avoid <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">"Resource": "*"</code> on DynamoDB permissions. Explicitly specify the HelpDeskTickets table ARN to contain potential lateral compromise.</li>
                  <li><strong>Action Boundaries:</strong> Lambda should never have permission to run <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">"dynamodb:DeleteTable"</code>. Only CRUD operations are permitted.</li>
                  <li><strong>KMS Cryptography:</strong> Enable KMS Server-Side Encryption (SSE) on the DynamoDB table to secure data-at-rest.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 5: Deployment */}
        {activeSubTab === "deployment" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded">DevOps Deployment Manual</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">AWS Serverless Deployment Steps</h2>
              <p className="text-slate-500 text-sm mt-1">
                Provision full-stack serverless architecture in minutes using standard console workflows.
              </p>
            </div>

            <div className="space-y-6 text-sm text-slate-600">
              
              <div className="relative pl-8 space-y-2">
                <div className="absolute left-0 top-0.5 bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs">1</div>
                <h4 className="font-bold text-slate-800">Provision Amazon DynamoDB</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Go to AWS Console ➜ <strong>DynamoDB</strong> ➜ <strong>Create Table</strong>. Define Partition Key <code className="bg-slate-100 px-1 rounded text-red-600">ticketId</code> (Type String). Select On-Demand (PAYG) capacity modes to scale cost to absolute zero when there is no activity. Name the table <code className="bg-slate-100 px-1 rounded font-mono">HelpDeskTickets</code>.
                </p>
              </div>

              <div className="relative pl-8 space-y-2">
                <div className="absolute left-0 top-0.5 bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs">2</div>
                <h4 className="font-bold text-slate-800">Establish the Amazon SNS Topic</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Go to <strong>Simple Notification Service (SNS)</strong> ➜ <strong>Create Topic</strong>. Select Standard. Name it <code className="bg-slate-100 px-1 rounded font-mono">HelpDeskTicketTopic</code>. Once created, copy the <strong>Topic ARN</strong>. Click <strong>Create Subscription</strong>, select Protocol "Email", type in your personal address. Open your inbox, click **Confirm Subscription** to link SNS to your email client!
                </p>
              </div>

              <div className="relative pl-8 space-y-2">
                <div className="absolute left-0 top-0.5 bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs">3</div>
                <h4 className="font-bold text-slate-800">IAM Lambda Role Setup</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Create an execution role inside <strong>IAM</strong> with Lambda use case permissions. Attach the AWS-managed policy <code className="bg-slate-100 px-1 rounded font-mono">AWSLambdaBasicExecutionRole</code> (to support CloudWatch Logs streaming) and paste our customized inline policy from the Security Tab to support scoped DynamoDB and SNS topic interactions.
                </p>
              </div>

              <div className="relative pl-8 space-y-2">
                <div className="absolute left-0 top-0.5 bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs">4</div>
                <h4 className="font-bold text-slate-800">Deploy Serverless Functions</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload Node.js code files to Lambda or utilize the AWS CDK/Serverless Framework. Expose Lambda execution entry points through <strong>API Gateway REST HTTP integration</strong>, matching our route methods to achieve the designated REST specifications.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 6: Resume & GitHub */}
        {activeSubTab === "resume" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div>
              <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded">Resume & Portfolio Assets</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">Professional Credentials & Copy-Paste Bios</h2>
              <p className="text-slate-500 text-sm mt-1">
                Polished resume bullets and project writeups to make your Cloud Support/DevOps engineering application stand out.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">📄 Resume Experience Description</h3>
              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50 relative group">
                <button
                  onClick={() => handleCopy("• Architected a complete Serverless Help Desk Ticket Management system on AWS utilizing AWS Lambda, API Gateway, Amazon DynamoDB, and Amazon SNS to achieve zero downtime and automatic compute scaling.\n• Designed an optimized DynamoDB single-table schema with string-based ticketId partition keys, ensuring persistent ticket records and historical action logging with sub-10ms response latencies.\n• Orchestrated real-time email dispatch alerting mechanisms via Amazon SNS triggering on ticket priority and status mutations, achieving sub-second updates to corporate staff.\n• Enforced Least Privilege Access control by constructing detailed IAM service execution roles, narrowing lambda database write permissions.", "resume-copy")}
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg"
                  title="Copy Resume Bullets"
                >
                  {copiedText === "resume-copy" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                </button>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li><strong>AWS Cloud Systems Designer:</strong> Architected a complete Serverless Help Desk Ticket Management system on AWS utilizing AWS Lambda, API Gateway, Amazon DynamoDB, and Amazon SNS to achieve zero downtime and automatic compute scaling.</li>
                  <li><strong>Optimized NoSQL Schema:</strong> Designed an optimized DynamoDB single-table schema with string-based ticketId partition keys, ensuring persistent ticket records and historical action logging with sub-10ms response latencies.</li>
                  <li><strong>Real-time Alert Pub/Sub:</strong> Orchestrated real-time email dispatch alerting mechanisms via Amazon SNS triggering on ticket priority and status mutations, achieving sub-second updates to corporate staff.</li>
                  <li><strong>Security Auditing:</strong> Enforced Least Privilege Access control by constructing detailed IAM service execution roles, narrowing lambda database write permissions.</li>
                </ul>
              </div>

              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">💻 GitHub Project Repository Readme Info</h3>
              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50 text-xs text-slate-600 leading-relaxed">
                Provide a compelling, professional layout to hook tech recruiters visiting your GitHub profile:
                <p className="mt-2 text-slate-500 font-mono italic">
                  "This project presents a secure Serverless Ticket Dispatch Dashboard enabling employees to report hardware, software, network, and general access requests directly to Support Administrators. Created using React, Tailwind CSS, Node.js Lambda logic, API Gateway proxy triggers, and Amazon SNS alerting, it features an built-in interactive local AWS cloud dashboard logging API Gateway Latency traces, CloudWatch execution stacks, and SNS notification states directly in-app!"
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
