import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldCheck, Database, Trash2, UserPlus, AlertCircle, RefreshCw, Check, CheckCircle2, ChevronRight, Search, Filter, HelpCircle, HardDrive, Cpu, X, Lock, Key } from "lucide-react";
import { Ticket } from "../types";

export interface AdminDashboardProps {
  currentUser?: {
    name: string;
    email: string;
    department: string;
    role: "employee" | "admin" | "guest";
    cognitoId: string;
  } | null;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps = {}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("admin"); // default demo password
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Auto-authorize if Cognito Admin is signed in
  useEffect(() => {
    if (currentUser && currentUser.role === "admin") {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [currentUser]);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchTickets();
    }
  }, [isAuthorized]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "admin") {
      setIsAuthorized(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Invalid administrator credential. Use 'admin' for sandbox preview authorization.");
    }
  };

  // Perform operational transitions on tickets (assignment, status, priority, deletion)
  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>, actionName: string) => {
    setActionLoading(`${id}-${actionName}`);
    try {
      const payload = {
        ...updates,
        actor: "Admin (SysAdmin)"
      };
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedTkt = await res.json();
        setTickets(tickets.map(t => t.ticketId === id ? updatedTkt : t));
        if (selectedTicket?.ticketId === id) {
          setSelectedTicket(updatedTkt);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTicket = async (id: string, force: boolean = false) => {
    if (!force) {
      setShowDeleteConfirmId(id);
      return;
    }
    
    setActionLoading(`${id}-delete`);
    try {
      const res = await fetch(`/api/tickets/${id}?actor=Admin_Supervisor`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTickets(tickets.filter(t => t.ticketId !== id));
        setSelectedTicket(null);
        setShowDeleteConfirmId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Statistics Calculations
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "Open").length,
    inProgress: tickets.filter(t => t.status === "In Progress" || t.status === "Assigned").length,
    closed: tickets.filter(t => t.status === "Closed" || t.status === "Resolved").length,
    critical: tickets.filter(t => t.priority === "Critical").length,
  };

  // Chart Data preparation
  // 1. Department Distribution Bar chart
  const deptMap: Record<string, number> = {};
  tickets.forEach(t => {
    deptMap[t.department] = (deptMap[t.department] || 0) + 1;
  });
  const deptChartData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  // 2. Status distribution Pie chart
  const statusMap: Record<string, number> = {
    "Open": 0, "In Progress": 0, "Resolved": 0, "Closed": 0, "Assigned": 0
  };
  tickets.forEach(t => {
    statusMap[t.status] = (statusMap[t.status] || 0) + 1;
  });
  const statusChartData = Object.entries(statusMap)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#64748b", "#a855f7"];

  // Filter & Search Tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Admin login screen
  if (!isAuthorized) {
    return (
      <div id="admin-login-container" className="max-w-md mx-auto my-12 bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Administrator Console Gateway</h2>
          <p className="text-xs text-slate-400">Authorized administrative security clearance is required.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[11px] text-red-700 flex items-start space-x-1.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600 uppercase block tracking-wider">Access Passcode</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Type 'admin' for sandbox preview access"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">For sandbox testing, authorization code is set to <strong className="text-amber-700">"admin"</strong>.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm"
          >
            Authenticate Credentials
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-root" className="space-y-6">
      
      {/* 1. Statistics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active</span>
          <span className="text-2xl font-bold text-slate-800 font-mono mt-1 block">{stats.total}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">DynamoDB table items</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open Queue</span>
          <span className="text-2xl font-bold text-sky-600 font-mono mt-1 block">{stats.open}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Requires triage</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
          <span className="text-2xl font-bold text-orange-600 font-mono mt-1 block">{stats.inProgress}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Engaged engineers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono mt-1 block">{stats.closed}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Resolved & Closed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Critical Severity</span>
          <span className="text-2xl font-bold text-red-600 font-mono mt-1 block">{stats.critical}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Priority triggers SNS</span>
        </div>

      </div>

      {/* 2. Analytical Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Tickets by Department</h3>
            <p className="text-[11px] text-slate-400">Total reported tickets distributed across business groups.</p>
          </div>
          <div className="h-64 text-xs font-mono">
            {deptChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No metrics data to render.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Ticket Status Composition</h3>
            <p className="text-[11px] text-slate-400">Workflow distribution percentage across active tickets.</p>
          </div>
          <div className="h-64 text-xs font-mono flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No distribution data to render.</div>
            ) : (
              <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-around">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 p-4">
                  {statusChartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center space-x-2 text-[10px]">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="font-bold text-slate-600">{entry.name}:</span>
                      <span className="text-slate-800 font-mono font-bold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Ticket Management list controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        
        {/* Filter bar */}
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, employee, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-bold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-250 bg-white rounded-lg px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none"
              >
                <option>All</option>
                <option>Open</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-bold">Severity:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-slate-250 bg-white rounded-lg px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none"
              >
                <option>All</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>

          </div>
        </div>

        {/* Tickets Table */}
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="h-6 w-6 text-amber-500 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Scanning DynamoDB Table...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-20 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 text-slate-300 mx-auto animate-pulse" />
            <p className="text-xs font-semibold">No tickets match active parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 font-semibold">Workflow Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((tkt) => {
                  let priorityColor = "text-slate-600 bg-slate-100 border-slate-200";
                  if (tkt.priority === "Medium") priorityColor = "text-amber-700 bg-amber-50 border-amber-200";
                  if (tkt.priority === "High") priorityColor = "text-orange-700 bg-orange-50 border-orange-200";
                  if (tkt.priority === "Critical") priorityColor = "text-red-700 bg-red-50 border-red-200";

                  let statusColor = "text-slate-600 bg-slate-100 border-slate-200";
                  if (tkt.status === "Open") statusColor = "text-sky-700 bg-sky-50 border-sky-200";
                  if (tkt.status === "Assigned") statusColor = "text-purple-700 bg-purple-50 border-purple-200";
                  if (tkt.status === "In Progress") statusColor = "text-orange-700 bg-orange-50 border-orange-200";
                  if (tkt.status === "Resolved") statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

                  return (
                    <tr key={tkt.ticketId} className="hover:bg-slate-50/55 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{tkt.ticketId}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{tkt.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{tkt.department}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        <div className="font-bold text-slate-800 truncate">{tkt.subject}</div>
                        <div className="text-[10px] text-slate-400 truncate">{tkt.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg border font-bold text-[9px] ${priorityColor}`}>
                          {tkt.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={tkt.assignedTo}
                          onChange={(e) => handleUpdateTicket(tkt.ticketId, { assignedTo: e.target.value }, "assign")}
                          disabled={actionLoading === `${tkt.ticketId}-assign`}
                          className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-medium bg-white focus:outline-none"
                        >
                          <option>Unassigned</option>
                          <option>Sarah Jenkins (Support L2)</option>
                          <option>Dave Miller (SysOps L3)</option>
                          <option>Megan Fox (Networking Lead)</option>
                          <option>Chris Evans (SecOps Architect)</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={tkt.status}
                          onChange={(e) => handleUpdateTicket(tkt.ticketId, { status: e.target.value as any }, "status")}
                          disabled={actionLoading === `${tkt.ticketId}-status`}
                          className={`border rounded px-1.5 py-0.5 text-xs font-bold bg-white focus:outline-none ${statusColor}`}
                        >
                          <option value="Open">Open</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {showDeleteConfirmId === tkt.ticketId ? (
                            <div className="flex items-center space-x-1 bg-red-50 border border-red-150 px-1.5 py-0.5 rounded-lg animate-fadeIn text-[10px]">
                              <span className="font-bold text-red-600 animate-pulse mr-1">Sure?</span>
                              <button
                                onClick={() => handleDeleteTicket(tkt.ticketId, true)}
                                disabled={actionLoading === `${tkt.ticketId}-delete`}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-1.5 py-0.5 rounded text-[9px] transition-all"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirmId(null)}
                                disabled={actionLoading === `${tkt.ticketId}-delete`}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px] transition-all"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedTicket(tkt)}
                                className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/50 p-1.5 rounded-lg transition-colors"
                                title="View Complete Logs & Details"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirmId(tkt.ticketId)}
                                disabled={actionLoading === `${tkt.ticketId}-delete`}
                                className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/50 p-1.5 rounded-lg transition-colors"
                                title="Purge Ticket"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Overlay */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between text-xs space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-amber-600 block">{selectedTicket.ticketId}</span>
                  <h3 className="font-bold text-base text-slate-800">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* General details specs */}
              <div className="grid grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">Submitter Name:</span>
                  <span className="text-slate-700 font-semibold block">{selectedTicket.employeeName}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">Submitter Email:</span>
                  <span className="text-slate-700 font-semibold block">{selectedTicket.employeeEmail}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">Department / Category:</span>
                  <span className="text-slate-700 font-semibold block">{selectedTicket.department} / {selectedTicket.category}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium block">Assigned Support Staff:</span>
                  <span className="text-slate-700 font-semibold block">{selectedTicket.assignedTo}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Description:</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Lifecycle logs */}
              <div className="space-y-3">
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Historical Workflow Audit Log:</span>
                <div className="relative pl-4 border-l border-slate-150 space-y-4">
                  {(selectedTicket.history || []).map((h, idx) => (
                    <div key={h.id || idx} className="relative">
                      <span className="absolute -left-[21px] top-1 bg-white border border-slate-300 rounded-full h-2.5 w-2.5 flex items-center justify-center">
                        <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-slate-700">{h.action}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{h.details}</p>
                        <span className="text-[9px] text-slate-400">Actor: <strong className="text-slate-600">{h.actor}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-150 pt-3 text-center">
              <span className="text-[10px] text-slate-400 font-mono">AWS Lambda Service execution logs streamed dynamically to CloudWatch Logs</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
