import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Server, Users, ShieldAlert, Terminal, Settings, FileText, ChevronRight, HardDrive, HelpCircle, User, ShieldCheck, LogIn, LogOut, Check, Activity, Shield } from "lucide-react";
import EmployeePortal from "./components/EmployeePortal";
import AdminDashboard from "./components/AdminDashboard";
import AWSConsoleSimulator from "./components/AWSConsoleSimulator";
import CredentialsPanel from "./components/CredentialsPanel";
import DocumentationTab from "./components/DocumentationTab";

type TabType = "employee" | "admin" | "aws" | "config" | "docs";

export interface UserIdentity {
  name: string;
  email: string;
  department: string;
  role: "employee" | "admin" | "guest";
  cognitoId: string;
}

const SIMULATED_USERS: UserIdentity[] = [
  {
    name: "SysAdmin Supervisor",
    email: "admin@yourcompany.com",
    department: "IT Operations",
    role: "admin",
    cognitoId: "us-east-1_f7c1d328-9d"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("employee");
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(() => {
    const saved = localStorage.getItem("serverless_helpdesk_auth");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return null; // default to guest
      }
    }
    return null; // default to guest
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("serverless_helpdesk_auth", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("serverless_helpdesk_auth");
    }
  }, [currentUser]);

  const selectUser = (user: UserIdentity | null) => {
    setCurrentUser(user);
    if (user) {
      setNotificationMsg(`Cognito IDP Session: Authenticated as ${user.name} (${user.role.toUpperCase()})`);
      // Redirect to correct dashboard to provide seamless UX
      if (user.role === "admin") {
        setActiveTab("admin");
      } else {
        setActiveTab("employee");
      }
    } else {
      setNotificationMsg("Cognito IDP Session: Cleared token. Operating as Anonymous Guest.");
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      
      {/* Upper Navigation Header */}
      <header className="bg-slate-900 text-white shadow-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-lg shadow-md border border-amber-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm tracking-tight text-white uppercase font-mono">Serverless Help Desk</h1>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">AWS Portfolio Piece</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">IT Ticket Management, DynamoDB Single-Table Schema & Amazon SNS Alerts</p>
            </div>
          </div>

          {/* Tab buttons */}
          <nav className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
            
            <button
              onClick={() => setActiveTab("employee")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === "employee"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Employee Portal</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === "admin"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("aws")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === "aws"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>AWS Console Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === "config"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>DevOps Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === "docs"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Documentation Tab</span>
            </button>

          </nav>

        </div>
      </header>

      {/* Cognito Simulated User Sign In control bar */}
      <section className="bg-slate-900 border-t border-slate-800/80 text-white py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 shrink-0">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span className="text-slate-400 text-[11px] font-medium">User Pools Sign-In Directory:</span>
          </div>

          {/* Users Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SIMULATED_USERS.map((user) => {
              const isSelected = currentUser?.cognitoId === user.cognitoId;
              return (
                <button
                  key={user.cognitoId}
                  onClick={() => selectUser(user)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-all text-[11px] font-semibold border ${
                    isSelected
                      ? "bg-slate-800 text-white border-amber-500/80 shadow-sm"
                      : "bg-slate-950/40 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${user.role === 'admin' ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                  <span>{user.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono font-normal">({user.role === 'admin' ? 'IAM Admin' : 'Employee'})</span>
                </button>
              );
            })}

            <button
              onClick={() => selectUser(null)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all text-[11px] font-semibold border ${
                currentUser === null
                  ? "bg-slate-800 text-white border-amber-500/80 shadow-sm"
                  : "bg-slate-950/40 text-slate-400 border-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span>Guest / Anonymous</span>
            </button>
          </div>
        </div>
      </section>

      {/* Global alert banner for Cognito context state updates */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold font-mono flex items-center justify-center space-x-2 border-b border-amber-600/30"
          >
            <ShieldCheck className="h-4 w-4 text-slate-950" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {activeTab === "employee" && <EmployeePortal currentUser={currentUser} />}
            {activeTab === "admin" && <AdminDashboard currentUser={currentUser} />}
            {activeTab === "aws" && <AWSConsoleSimulator />}
            {activeTab === "config" && <CredentialsPanel />}
            {activeTab === "docs" && <DocumentationTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Layout Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 font-mono text-[10px]">
          <span>Serverless Help Desk System v1.1.0 • AWS Cloud Solutions Architect Portfolio</span>
          <span className="flex items-center space-x-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-500">Infrastructure Online (Region: Multi-AZ US East)</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
