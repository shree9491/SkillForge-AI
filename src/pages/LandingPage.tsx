import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Zap, Target, BookOpen, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-32 py-10">
      {/* Hero */}
      <section className="text-center max-w-4xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="tech-label mb-6"
        >
          // VERSION_3.0_RELEASE
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif italic text-6xl md:text-8xl text-white tracking-tighter leading-none"
        >
          Forge Elite Skills with <span className="text-[#00FFF2]">Autonomous AI</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10 text-xl text-dim font-serif italic max-w-2xl"
        >
          SkillForge AI transforms project requirements into structured learning paths and autonomous task evaluations.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row gap-8 justify-center"
        >
          <Link 
            to="/login"
            className="px-10 py-5 bg-[#00FFF2] text-black rounded-sm font-sans font-black tracking-ultra uppercase text-sm hover:bg-white transition-all shadow-[0_0_30px_rgba(0,255,242,0.3)]"
          >
            Initiate System
          </Link>
          <button className="px-10 py-5 border border-subtle text-white rounded-sm font-sans font-bold tracking-widest uppercase text-xs hover:border-[#00FFF2] transition-all">
            Documentation
          </button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-subtle border-y border-subtle">
        {[
          { icon: Target, title: "Requirement Agent", text: "Converts high-level goals into precise skill plans and difficulty-mapped modules." },
          { icon: BookOpen, title: "Course Agent", text: "Generates deep-dive learning content, real-world examples, and challenging tasks." },
          { icon: ShieldCheck, title: "Validation Agent", text: "Evaluates GitHub submissions and conducts tiered interviews for skill proof." },
        ].map((f, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="p-12 bg-[#0A0A0A] hover:bg-white/[0.02] transition-colors"
          >
            <div className="tech-label text-[#00FFF2] mb-6 flex items-center gap-2">
              <span className="font-mono">AG_0{i+1}</span>
              <f.icon className="w-3 h-3" />
            </div>
            <h3 className="font-serif italic text-2xl text-white mb-4">{f.title}</h3>
            <p className="text-dim text-sm leading-relaxed font-sans">{f.text}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
