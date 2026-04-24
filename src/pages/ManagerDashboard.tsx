import React, { useState, useEffect } from "react";
import { collection, query, where, addDoc, getDocs, updateDoc, doc, serverTimestamp, setDoc, orderBy, onSnapshot } from "firebase/firestore";
import { requirementAgent, courseAgent } from "../services/geminiService";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { Project, ProjectStatus, UserProfile, Module } from "../types";
import { Plus, Send, CheckCircle, Clock, AlertCircle, ChevronRight, UserPlus, Zap, X, Code, MessageSquare, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [goalText, setGoalText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchEmployees();
    
    // Real-time project subscription
    const q = query(collection(db, "projects"), where("manager_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const updatedProjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      setProjects(updatedProjects);
      
      // Update inspecting project if active
      setInspectingProject(prev => {
        if (!prev) return null;
        const fresh = updatedProjects.find(p => p.id === prev.id);
        return fresh || prev;
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchEmployees = async () => {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const snap = await getDocs(q);
    setEmployees(snap.docs.map(d => d.data() as UserProfile));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText || !user) return;
    setIsCreating(true);

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        manager_id: user.uid,
        goal_text: goalText,
        status: "new_project",
        current_module: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const plan = await requirementAgent(goalText);

      await updateDoc(doc(db, "projects", docRef.id), {
        approved_plan: plan,
        status: "plan_generated",
        updatedAt: serverTimestamp(),
      });

      setGoalText("");
    } catch (error: any) {
      console.error("Project creation failed", error);
      alert(`AGENT_FAILURE: ${error.message || "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprovePlan = async (projectId: string, employeeId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.approved_plan) return;

    try {
      await updateDoc(doc(db, "projects", projectId), {
        status: "plan_approved",
        employee_id: employeeId,
        updatedAt: serverTimestamp(),
      });

      const modules = await courseAgent(project.approved_plan);

      for (let i = 0; i < modules.length; i++) {
        await addDoc(collection(db, "projects", projectId, "modules"), {
          ...modules[i],
          index: i + 1,
          project_id: projectId
        });
      }

      await updateDoc(doc(db, "projects", projectId), {
        status: "course_ready",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Plan approval failed", error);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <header className="flex justify-between items-end border-b border-subtle pb-6">
        <div>
          <span className="tech-label mb-2">ORCHESTRATOR_DASH // MANAGER_SECURE</span>
          <h2 className="font-serif italic text-4xl text-white">Active Skill Missions</h2>
        </div>
      </header>

      {/* Create Project Section */}
      <section className="bg-white/[0.02] p-10 border border-subtle relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="w-20 h-20 text-[#00FFF2]" />
        </div>
        <div className="tech-label mb-6 flex items-center gap-2">
          <Plus className="w-3 h-3" /> Initialize new_mission_requirement
        </div>
        <form onSubmit={handleCreateProject} className="flex flex-col gap-6">
          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="[ INPUT_GOAL_HERE ] ..."
            className="w-full h-40 p-6 bg-[#0A0A0A] border border-subtle rounded-sm font-serif italic text-lg text-white focus:border-[#00FFF2] outline-none transition-all resize-none placeholder:text-dim/30"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !goalText}
            className={`self-end px-10 py-4 font-sans font-black tracking-ultra uppercase text-xs transition-all ${
              isCreating 
                ? "bg-dim/10 text-dim cursor-not-allowed border border-subtle" 
                : "bg-[#00FFF2] text-black hover:bg-white active-glow"
            }`}
          >
            {isCreating ? "AGENT_PROCESSING..." : "INITIATE_AI_FORGE"}
          </button>
        </form>
      </section>

      {/* Projects List */}
      <section className="flex flex-col gap-6">
        <h3 className="tech-label text-dim">LIVE_MISSION_BUFFER</h3>
        {loading ? (
          <div className="h-40 flex items-center justify-center font-mono text-xs text-dim uppercase tracking-widest">
            Fetching project states...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed border-subtle bg-white/[0.01] font-serif italic text-dim">
            Empty mission queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-subtle border border-subtle">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                employees={employees} 
                onApprove={handleApprovePlan}
                onInspect={() => setInspectingProject(project)}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {inspectingProject && (
          <StreamInspector 
            project={inspectingProject} 
            employees={employees}
            onClose={() => setInspectingProject(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const ProjectCard: React.FC<{ 
  project: Project, 
  employees: UserProfile[], 
  onApprove: (pid: string, eid: string) => void,
  onInspect: () => void
}> = ({ project, employees, onApprove, onInspect }) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const statusInfo: Record<ProjectStatus, { color: string, icon: any }> = {
    new_project: { color: "text-blue-400 border-blue-400/30", icon: Clock },
    plan_generated: { color: "text-[#00FFF2] border-[#00FFF2]/30", icon: Zap },
    plan_approved: { color: "text-yellow-400 border-yellow-400/30", icon: Clock },
    course_ready: { color: "text-emerald-400 border-emerald-400/30", icon: CheckCircle },
    task_submitted: { color: "text-orange-400 border-orange-400/30", icon: AlertCircle },
    interview_ready: { color: "text-cyan-400 border-cyan-400/30", icon: MessageSquare },
    interview_phase: { color: "text-cyan-600 border-cyan-600/30", icon: Zap },
    evaluation_running: { color: "text-purple-400 border-purple-400/30", icon: Zap },
    evaluation_done: { color: "text-[#00FFF2] border-[#00FFF2]", icon: CheckCircle },
    repeat_module: { color: "text-red-400 border-red-400/30", icon: AlertCircle },
    next_module: { color: "text-[#00FFF2] border-[#00FFF2]/50", icon: Zap },
    report_generated: { color: "text-white border-white/30", icon: AlertCircle },
    error: { color: "text-red-600 border-red-600/30", icon: AlertCircle },
  };

  const status = statusInfo[project.status] || statusInfo.new_project;

  return (
    <motion.div 
      layout
      className="bg-[#0A0A0A] p-10 transition-colors hover:bg-white/[0.02] flex flex-col gap-8"
      id={`project-${project.id}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <span className={`px-2 py-0.5 border text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 ${status.color}`}>
              <status.icon className="w-3 h-3" /> {project.status.replace("_", " ")}
            </span>
            <span className="font-mono text-[9px] text-dim uppercase tracking-widest leading-none">ID: {project.id.slice(0, 8)}</span>
          </div>
          <h3 className="font-serif italic text-2xl text-white line-clamp-1">{project.goal_text}</h3>
        </div>
      </div>

      {project.status === "plan_generated" && project.approved_plan && (
        <div className="border border-subtle bg-white/[0.03] p-8">
           <h4 className="tech-label mb-6 text-white">// AI_GENERATED_STRATEGY</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <span className="tech-label text-dim">Extracted_Skills</span>
                <div className="flex flex-wrap gap-2">
                  {project.approved_plan.skills?.map((s: string) => (
                    <span key={s} className="px-2 py-1 border border-subtle text-[10px] text-white font-mono uppercase">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-6">
                 <div className="flex flex-col gap-2">
                    <span className="tech-label text-dim">Deployment_Target</span>
                    <select 
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full p-3 bg-[#0A0A0A] border border-subtle border-l-2 border-l-[#00FFF2] text-sm text-white focus:outline-none appearance-none font-mono"
                    >
                      <option value="">[ SELECT_ENTITY ]</option>
                      {employees.map(e => <option key={e.uid} value={e.uid}>{e.displayName}</option>)}
                    </select>
                 </div>
                 <button 
                   onClick={() => onApprove(project.id, selectedEmployee)}
                   disabled={!selectedEmployee}
                   className={`w-full py-4 font-sans font-black tracking-ultra uppercase text-xs transition-all ${
                     selectedEmployee ? 'bg-[#00FFF2] text-black active-glow' : 'bg-dim/10 text-dim cursor-not-allowed border border-subtle'
                   }`}
                   id={`deploy-${project.id}`}
                 >
                   Deploy Skill Course
                 </button>
              </div>
           </div>
        </div>
      )}

      {(project.status === "course_ready" || project.status === "task_submitted") && (
        <div className="flex justify-between items-center pt-8 border-t border-subtle">
           <div className="flex items-center gap-3">
              <span className="tech-label text-dim">Active_Subject:</span>
              <span className="font-serif italic text-white">{employees.find(e => e.uid === project.employee_id)?.displayName || "SUBJECT_UNKNOWN"}</span>
           </div>
           <button 
             onClick={onInspect}
             className="tech-label text-[#00FFF2] hover:text-white transition-colors flex items-center gap-2"
             id={`inspect-${project.id}`}
           >
              Inspect_Stream <ChevronRight className="w-3 h-3" />
           </button>
        </div>
      )}
    </motion.div>
  );
};

const StreamInspector: React.FC<{ 
  project: Project, 
  employees: UserProfile[], 
  onClose: () => void 
}> = ({ project, employees, onClose }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    fetchModules();
  }, [project.id]);

  const fetchModules = async () => {
    const q = query(collection(db, "projects", project.id, "modules"), orderBy("index", "asc"));
    const snap = await getDocs(q);
    setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
    setLoading(false);
  };

  const employee = employees.find(e => e.uid === project.employee_id);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-end"
      id="modal-overlay"
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-4xl h-full bg-[#0A0A0A] border-l border-subtle flex flex-col relative"
        id="inspector-panel"
      >
        <div className="p-8 border-b border-subtle flex justify-between items-center">
          <div>
            <span className="tech-label text-dim mb-1">INSPECTION_STREAM // {project.id.slice(0, 8)}</span>
            <h2 className="font-serif italic text-3xl text-white">Project Evolution Monitoring</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 transition-colors border border-subtle rounded-full"
            id="close-button"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="flex flex-col gap-12 max-w-2xl">
            {/* Header Data */}
            <div className="grid grid-cols-2 gap-8 pb-12 border-b border-subtle">
              <div className="flex flex-col gap-2">
                <span className="tech-label text-dim">Active_Subject</span>
                <p className="font-serif italic text-white text-xl">{employee?.displayName || "UNKNOWN"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="tech-label text-dim">Mission_Status</span>
                <p className="font-mono text-xs text-[#00FFF2] uppercase tracking-widest">{project.status.replace("_", " ")}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-4 py-20 font-mono text-xs text-dim animate-pulse">
                SYNCING_STREAM_DATA...
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                <h3 className="tech-label text-white">// SKILL_MODULE_TRACE</h3>
                {modules.map((m, i) => (
                  <button 
                    key={m.id} 
                    className="p-8 border border-subtle bg-white/[0.02] flex flex-col gap-6 relative group overflow-hidden text-left hover:border-[#00FFF2]/50 transition-all active:scale-[0.98]" 
                    id={`inspect-module-${m.id}`}
                    onClick={() => setSelectedModule(m)}
                  >
                    <div className="absolute top-0 right-0 p-4 font-mono text-[80px] leading-none opacity-[0.03] group-hover:opacity-10 transition-opacity">0{i + 1}</div>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="tech-label text-dim">Module_0{i + 1}</span>
                        <h4 className="font-serif italic text-2xl text-white">{m.module_title}</h4>
                      </div>
                    </div>
                    <div>
                        <span className="tech-label text-[#00FFF2] block mb-3 text-[10px] font-black uppercase tracking-widest">
                           Open Challenge_Target
                        </span>
                        <p className="text-sm text-white/50 italic font-serif leading-relaxed line-clamp-2">{m.task.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {project.status === "evaluation_done" && (
              <div className="flex flex-col gap-8 p-10 border border-[#00FFF2]/30 bg-[#00FFF2]/5 mt-10">
                 <div className="flex items-center justify-between">
                    <div>
                      <div className="tech-label text-[#00FFF2] mb-1">TERMINAL_EVALUATION_SCORE</div>
                      <p className="font-sans text-5xl font-black text-white tracking-tighter">
                         {project.final_score}<span className="text-xl text-dim">%</span>
                      </p>
                    </div>
                    <Award className="w-12 h-12 text-[#00FFF2]" />
                 </div>
                 
                 <div className="flex flex-col gap-2">
                   <span className="tech-label text-dim">Agent_Feedback</span>
                   <p className="font-mono text-[11px] text-white/50 bg-black/50 p-4 leading-relaxed font-italic">
                     {">"} {project.feedback}
                   </p>
                 </div>

                 {project.github_url && (
                    <div className="flex flex-col gap-2">
                       <span className="tech-label text-dim">Proof_of_Work</span>
                       <a href={project.github_url} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-[#00FFF2] hover:underline flex items-center gap-2">
                          <Code className="w-3 h-3" /> {project.github_url}
                       </a>
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Module Detail Overlay */}
        <AnimatePresence>
          {selectedModule && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-[#0A0A0A]/90 backdrop-blur-md p-12 flex flex-col overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedModule(null)}
                className="tech-label text-dim hover:text-[#00FFF2] flex items-center gap-2 mb-12 self-start transition-colors"
              >
                <X className="w-3 h-3" /> CLOSE_DETAIL_VIEW
              </button>

              <div className="max-w-2xl flex flex-col gap-10">
                <div className="flex flex-col gap-2">
                  <div className="tech-label text-[#00FFF2]">MODULE_CHALLENGE_DETAILS</div>
                  <h3 className="font-serif italic text-5xl text-white underline decoration-[#00FFF2]/30 decoration-4 underline-offset-8">
                    {selectedModule.module_title}
                  </h3>
                </div>

                <div className="flex flex-col gap-6">
                   <div className="flex flex-col gap-3">
                      <span className="tech-label text-dim flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Core_Objective
                      </span>
                      <p className="font-serif italic text-2xl text-white/90 leading-relaxed">
                        {selectedModule.task.title}
                      </p>
                   </div>

                   <div className="flex flex-col gap-3">
                      <span className="tech-label text-dim">System_Requirement_Trace</span>
                      <p className="text-sm text-white/60 leading-relaxed font-sans bg-white/[0.03] p-6 border border-subtle">
                        {selectedModule.task.description}
                      </p>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                      {selectedModule.task.requirements.map((r, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border border-subtle bg-black/40">
                           <div className="w-1 h-1 bg-[#00FFF2] rounded-full" />
                           <span className="font-mono text-[11px] text-dim uppercase tracking-tight">{r}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
