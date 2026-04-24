import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex items-center justify-center py-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/[0.03] p-12 rounded-sm border border-subtle text-center relative overflow-hidden"
      >
        <div className="tech-label mb-8">SECURE_GATEWAY // AUTH_REQUIRED</div>
        <h2 className="font-serif italic text-4xl text-white mb-4">Welcome</h2>
        <p className="text-dim text-sm mb-12 font-sans">Access the SkillForge AI multi-agent orchestrator.</p>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 py-5 px-6 bg-[#00FFF2] text-black rounded-sm font-sans font-black tracking-ultra uppercase text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,242,0.1)]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
          Continue with Google
        </button>

        <p className="mt-12 text-[9px] text-dim font-mono tracking-widest uppercase">
          [ ACCESS_CONTROL_PROTOCOL_V4 ]
        </p>
      </motion.div>
    </div>
  );
}
