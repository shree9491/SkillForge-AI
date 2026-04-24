import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { motion } from "motion/react";
import { UserRole } from "../types";
import { ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const [isPending, setIsPending] = useState(false);
  const { setRole } = useAuth();

  const handleRoleSelect = async (role: UserRole) => {
    setIsPending(true);
    try {
      await setRole(role);
    } catch (error: any) {
      console.error("Role selection failed", error);
      alert(`ROLE_SELECTION_FAILURE: ${error.message || "Unknown error"}`);
    } finally {
      setIsPending(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFF2]"></div>
        <div className="tech-label animate-pulse">INITIALIZING_PROTOCOL...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-20">
      <div className="text-center mb-16">
        <div className="tech-label mb-4">IDENTITY_PROTOCOL // INITIALIZATION</div>
        <h2 className="font-serif italic text-5xl text-white mb-4">Choose Your Path</h2>
        <p className="text-dim font-serif italic text-lg">Select your primary role to initialize the workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-subtle border border-subtle">
        <motion.button
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
          onClick={() => handleRoleSelect("manager")}
          className="p-12 bg-[#0A0A0A] transition-all text-left flex flex-col gap-6 group"
        >
          <div className="tech-label text-dim group-hover:text-[#00FFF2]">PATH_01</div>
          <div className="flex flex-col">
            <h3 className="font-serif italic text-3xl text-white mb-2">Manager</h3>
            <p className="text-dim text-sm leading-relaxed">Assign projects, approve plans, and track team progress via the orchestrator.</p>
          </div>
          <div className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[#00FFF2] text-[10px] font-black tracking-ultra uppercase items-center flex gap-2">
              Select Role <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
          onClick={() => handleRoleSelect("employee")}
          className="p-12 bg-[#0A0A0A] transition-all text-left flex flex-col gap-6 group"
        >
          <div className="tech-label text-dim group-hover:text-[#00FFF2]">PATH_02</div>
          <div className="flex flex-col">
            <h3 className="font-serif italic text-3xl text-white mb-2">Employee</h3>
            <p className="text-dim text-sm leading-relaxed">Learn modules, execute tasks, and prove your skills through AI evaluation.</p>
          </div>
          <div className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[#00FFF2] text-[10px] font-black tracking-ultra uppercase items-center flex gap-2">
              Select Role <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
