import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Filter, Loader2, Paperclip, Send, Mail, User, Shield, Briefcase, HelpCircle, Check, AlertTriangle, FileText, ChevronRight, X, Clock, Eye, Trash2 } from "lucide-react";
import { Ticket } from "../types";

export interface EmployeePortalProps {
  currentUser?: {
    name: string;
    email: string;
    department: string;
    role: "employee" | "admin" | "guest";
    cognitoId: string;
  } | null;
}

export default function EmployeePortal({ currentUser }: EmployeePortalProps = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"list" | "new">("list");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);
  const [confirmDeleteInDetails, setConfirmDeleteInDetails] = useState<boolean>(false);
  
  // Create Ticket Form State
  const [employeeName, setEmployeeName] = useState<string>("");
  const [employeeEmail, setEmployeeEmail] = useState<string>("");
  const [department, setDepartment] = useState<string>("Engineering");
  const [category, setCategory] = useState<string>("Software Access");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<string>("Medium");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  // Synchronize Cognito Session Context
  useEffect(() => {
    if (currentUser) {
      setEmployeeName(currentUser.name);
      setEmployeeEmail(currentUser.email);
      setDepartment(currentUser.department);
    } else {
      setEmployeeName("");
      setEmployeeEmail("");
      setDepartment("Engineering");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    setConfirmDeleteInDetails(false);
  }, [selectedTicket]);

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

  const handleDeleteTicket = async (id: string, force: boolean = false) => {
    if (!force) {
      setShowDeleteConfirmId(id);
      return;
    }
    
    setDeletingId(id);
    try {
      const actorName = employeeName || "Employee";
      const res = await fetch(`/api/tickets/${id}?actor=${encodeURIComponent(actorName)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTickets(tickets.filter(t => t.ticketId !== id));
        setSelectedTicket(null);
        setShowDeleteConfirmId(null);
        setConfirmDeleteInDetails(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !employeeEmail.trim() || !subject.trim() || !description.trim()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        employeeName,
        employeeEmail,
        department,
        category,
        subject,
        description,
        priority,
        attachmentUrl: attachmentUrl || ""
      };
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFormSuccess(true);
        setSubject("");
        setDescription("");
        setAttachmentUrl("");
        setAttachmentName("");
        await fetchTickets();
        setActiveSubTab("list");
        setTimeout(() => setFormSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateS3Upload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      simulateS3Upload(file);
    }
  };

  const simulateS3Upload = (file: File) => {
    setAttachmentName(file.name);
    // Mimic AWS S3 destination path
    const mockS3Url = `https://help-desk-ticket-attachments.s3.us-east-1.amazonaws.com/uploads/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    setAttachmentUrl(mockS3Url);
  };

  // Filter and Search tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="employee-portal-root" className="space-y-6">
      
      {/* Sub Tabs Switcher */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-1 flex">
        <button
          onClick={() => setActiveSubTab("list")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
            activeSubTab === "list"
              ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>My Submitted Tickets ({tickets.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("new")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
            activeSubTab === "new"
              ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Ticketing Tab</span>
        </button>
      </div>

      {activeSubTab === "list" ? (
        /* Right Column: Submitted Tickets List */
        <div className="space-y-4 animate-fadeIn">
          
          {/* Header Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticketId, subject, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {["All", "Open", "In Progress", "Resolved", "Closed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    statusFilter === st
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-white text-slate-500 hover:text-slate-700 border-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Click to Go to New Ticketing Tab */}
            <button
              onClick={() => setActiveSubTab("new")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Support Ticket</span>
            </button>
          </div>

          {/* List display */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-20 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Scanning DynamoDB for submitted tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-20 text-center text-slate-500 space-y-2">
              <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold">No tickets found</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Try typing a different keyword or create a fresh IT support request on the New Ticketing Tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTickets.map((tkt) => {
                let badgeColor = "bg-slate-100 text-slate-600";
                if (tkt.status === "Open") badgeColor = "bg-sky-50 text-sky-700 border-sky-200";
                if (tkt.status === "In Progress") badgeColor = "bg-orange-50 text-orange-700 border-orange-200";
                if (tkt.status === "Resolved") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                if (tkt.status === "Closed") badgeColor = "bg-slate-100 text-slate-700 border-slate-300";

                let priorityDot = "bg-slate-400";
                if (tkt.priority === "Medium") priorityDot = "bg-amber-500";
                if (tkt.priority === "High") priorityDot = "bg-orange-500";
                if (tkt.priority === "Critical") priorityDot = "bg-red-600";

                return (
                  <div
                    key={tkt.ticketId}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-800">{tkt.ticketId}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} title={`Priority: ${tkt.priority}`}></span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {tkt.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{tkt.subject}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{tkt.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400">
                        <span>Submitted {new Date(tkt.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {showDeleteConfirmId === tkt.ticketId ? (
                          <div className="flex items-center space-x-1.5 bg-red-50 px-1.5 py-0.5 rounded border border-red-150 animate-fadeIn">
                            <span className="text-[9px] font-bold text-red-600 animate-pulse">Sure?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTicket(tkt.ticketId, true);
                              }}
                              disabled={deletingId === tkt.ticketId}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-[9px] px-1.5 py-0.5 rounded transition-all"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirmId(null);
                              }}
                              disabled={deletingId === tkt.ticketId}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] px-1.5 py-0.5 rounded transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setShowDeleteConfirmId(tkt.ticketId)}
                              disabled={deletingId === tkt.ticketId}
                              className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center transition-colors"
                              title="Delete Support Ticket"
                            >
                              <Trash2 className="h-3 w-3 mr-0.5" />
                              <span>Delete</span>
                            </button>

                            <button
                              onClick={() => setSelectedTicket(tkt)}
                              className="text-[10px] text-amber-600 hover:text-amber-700 font-bold flex items-center transition-colors"
                            >
                              <span>View Details</span>
                              <ChevronRight className="h-3 w-3 ml-0.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Left Column: Create Ticket Form */
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-5 animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-amber-600" />
                New Support Ticket
              </h2>
              <p className="text-xs text-slate-500 mt-1">Submit technical logs, software requests, or hardware alerts.</p>
            </div>
            <button
              onClick={() => setActiveSubTab("list")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel & View List
            </button>
          </div>

          {formSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-start space-x-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-emerald-950 mb-0.5">Ticket Submitted Successfully!</strong>
                Your confirmation email is being dispatched via AWS SNS topic. You can monitor progress on the right.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Employee Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-600 uppercase tracking-wider block">Full Name</label>
                {currentUser && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold flex items-center">
                    <Shield className="h-2.5 w-2.5 mr-1" /> Cognito Claim
                  </span>
                )}
              </div>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  disabled={!!currentUser}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-150"
                />
              </div>
            </div>

            {/* Employee Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-600 uppercase tracking-wider block">Corporate Email</label>
                {currentUser && (
                  <span className="text-[9px] text-slate-400 font-mono">ID: {currentUser.cognitoId.split("_")[1]}</span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="john.doe@corporate.com"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  disabled={!!currentUser}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-150"
                />
              </div>
            </div>

            {/* Category and Department */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider block">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!!currentUser}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Finance</option>
                  <option>HR</option>
                  <option>Operations</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option>Software Access</option>
                  <option>Hardware Failure</option>
                  <option>Network / VPN</option>
                  <option>Account Credentials</option>
                  <option>Office Facilities</option>
                  <option>Other / General</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 uppercase tracking-wider block">Issue Subject</label>
              <input
                type="text"
                required
                placeholder="Brief summary of the technical problem"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 uppercase tracking-wider block">Detailed Description</label>
              <textarea
                required
                rows={4}
                placeholder="Include error codes, diagnostic logs, steps to reproduce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 uppercase tracking-wider block">Severity Level</label>
              <div className="grid grid-cols-4 gap-2">
                {["Low", "Medium", "High", "Critical"].map((p) => {
                  let activeClass = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
                  if (priority === p) {
                    if (p === "Low") activeClass = "bg-slate-800 text-white border-slate-800";
                    if (p === "Medium") activeClass = "bg-amber-600 text-white border-amber-600";
                    if (p === "High") activeClass = "bg-orange-600 text-white border-orange-600";
                    if (p === "Critical") activeClass = "bg-red-600 text-white border-red-600";
                  }

                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-1.5 border rounded-lg text-center font-bold text-[10px] transition-all ${activeClass}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated S3 Drag & Drop attachment */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 uppercase tracking-wider block">Logs or Attachments</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-amber-500 bg-amber-50/55"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Paperclip className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                {attachmentName ? (
                  <div className="text-[10px] text-amber-700 font-bold font-mono truncate">
                    📎 {attachmentName}
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Drag files here or Browse</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Simulates uploading to AWS S3 storage</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center space-x-1.5 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Ticket to API Gateway...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Ticket Details Overlay Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between text-xs space-y-6">
            
            {/* Header controls */}
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

              {/* Grid ticket specs */}
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
                  <span className="text-slate-700 font-semibold block">{selectedTicket.assignedTo || "Unassigned"}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Description:</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* S3 link if exists */}
              {selectedTicket.attachmentUrl && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider">AWS S3 Secured Attachment:</span>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center space-x-1.5 text-amber-600 hover:text-amber-700 font-bold font-mono text-[10px] bg-amber-50 p-2 rounded-lg truncate max-w-full"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{selectedTicket.attachmentUrl}</span>
                  </a>
                </div>
              )}

              {/* Lifecycle logs */}
              <div className="space-y-3">
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Ticket Lifecycle Log History:</span>
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

            <div className="border-t border-slate-150 pt-4 flex flex-col items-center space-y-3">
              {confirmDeleteInDetails ? (
                <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 text-center space-y-2 animate-fadeIn">
                  <p className="text-[11px] font-bold text-red-700">Are you sure you want to delete this support ticket?</p>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.ticketId, true)}
                      disabled={deletingId === selectedTicket.ticketId}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      {deletingId === selectedTicket.ticketId ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteInDetails(false)}
                      disabled={deletingId === selectedTicket.ticketId}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-1.5 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteInDetails(true)}
                  disabled={deletingId === selectedTicket.ticketId}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-xl font-bold transition-all text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Support Ticket</span>
                </button>
              )}
              <span className="text-[10px] text-slate-400 font-mono text-center">AWS Lambda Service execution logs streamed dynamically to CloudWatch Logs</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
