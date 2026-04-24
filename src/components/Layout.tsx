import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { LogOut } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col font-sans selection:bg-[#00FFF2] selection:text-black">
      <header className="flex justify-between items-baseline border-b border-subtle px-10 py-10">
        <div className="flex flex-col">
          <Link to="/" className="flex flex-col group">
            <span className="tech-label mb-1">SYSTEM_V2.0 // PRODUCTION_READY</span>
            <h1 className="font-serif italic text-6xl leading-[0.85] text-white group-hover:text-[#00FFF2] transition-colors">SkillForge AI</h1>
          </Link>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-sans text-[10px] tracking-[0.2em] text-dim uppercase mb-1">Autonomous Multi-Agent Workforce</p>
          <p className="font-serif italic text-xl text-white">Skill Alignment System</p>
        </div>
        
        {user && (
          <div className="flex items-center gap-6 ml-10">
            {profile && (
              <span className="tech-label border border-[#00FFF2]/30 px-2 py-0.5 rounded">
                ROLE: {profile.role}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-dim hover:text-[#00FFF2] transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-10">
        {children}
      </main>

      <footer className="flex justify-between items-center px-10 py-10 border-t border-subtle">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <span className="font-sans text-[8px] text-dim uppercase tracking-widest mb-1">Service Core</span>
            <span className="font-serif italic text-sm text-white">SkillForge Autonomous Engine</span>
          </div>
          {user && profile && (
            <div className="flex flex-col">
              <span className="font-sans text-[8px] text-dim uppercase tracking-widest mb-1">Authenticated Identity</span>
              <span className="font-serif italic text-sm text-white">{profile.displayName}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="font-sans text-[8px] text-dim uppercase tracking-widest mb-1">System Timestamp</span>
          <p className="font-mono text-[10px] text-dim uppercase">{new Date().toISOString()}</p>
        </div>
      </footer>
    </div>
  );
}
