import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, onSnapshot, orderBy } from "firebase/firestore";
import { validationAgent, interviewEvaluationAgent } from "../services/geminiService";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { Project, Module, ProjectStatus } from "../types";
import { Book, Code, Send, CheckCircle2, ChevronRight, Github, MessageSquare, Award, Terminal as TerminalIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "projects"), where("employee_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const updatedProjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      setProjects(updatedProjects);
      
      // Sync selected project state with real-time updates
      setSelectedProject(prev => {
        if (!prev) return null;
        const fresh = updatedProjects.find(p => p.id === prev.id);
        return fresh || prev;
      });

      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchModules(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchModules = async (projectId: string) => {
    const q = query(collection(db, "projects", projectId, "modules"), orderBy("index", "asc"));
    const snap = await getDocs(q);
    setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
  };

  if (selectedProject) {
    return (
      <ModuleViewer 
        project={selectedProject} 
        modules={modules} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <header className="flex justify-between items-end border-b border-subtle pb-6">
        <div>
           <span className="tech-label mb-2">LEARNING_ENV // SUBJECT_SECURE</span>
           <h1 className="font-serif italic text-4xl text-white tracking-tight">Active Learning Missions</h1>
        </div>
      </header>

      {loading ? (
        <div className="h-40 flex items-center justify-center font-mono text-xs text-dim uppercase tracking-widest">
          Syncing mission data...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-subtle bg-white/[0.01] font-serif italic text-dim">
          No missions assigned to your profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-subtle border border-subtle">
          {projects.map((project) => (
            <MissionCard 
              key={project.id} 
              project={project} 
              onClick={() => setSelectedProject(project)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

const MissionCard: React.FC<{ project: Project, onClick: () => void }> = ({ project, onClick }) => {
  return (
    <motion.div 
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
      onClick={onClick}
      className="bg-[#0A0A0A] p-12 transition-all cursor-pointer flex flex-col gap-8 group"
    >
      <div className="flex justify-between items-start">
        <div className="tech-label text-dim group-hover:text-[#00FFF2]">MISSION_OBJECTIVE</div>
        <span className="font-mono text-[9px] text-[#00FFF2] border border-[#00FFF2]/30 px-2 py-0.5 rounded tracking-widest uppercase">
          {project.status.replace("_", " ")}
        </span>
      </div>
      <div>
        <h3 className="font-serif italic text-3xl text-white mb-4 line-clamp-2">{project.goal_text}</h3>
        <p className="text-dim text-sm leading-relaxed font-sans line-clamp-2 italic">Guided skill acquisition protocol initiated by management.</p>
      </div>
      <div className="mt-auto pt-8 border-t border-subtle flex justify-between items-center">
         <span className="tech-label text-dim group-hover:text-white transition-colors">Enter Environment</span>
         <ChevronRight className="w-5 h-5 text-dim border border-subtle rounded-full p-1 group-hover:border-[#00FFF2] group-hover:text-[#00FFF2] transition-all" />
      </div>
    </motion.div>
  );
}

function InterviewPhase({ project, onComplete }: { project: Project, onComplete: (answers: any) => void }) {
  const [answers, setAnswers] = useState<any>({
    concept: ["", "", "", "", ""],
    task: ["", "", "", "", ""],
    modifications: ["", "", "", "", ""]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interview = (project as any).interview;

  const handleComplete = async () => {
    setIsSubmitting(true);
    await onComplete(answers);
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-12 bg-white/[0.02] border border-[#00FFF2]/20 p-12 active-glow"
    >
      <div className="flex flex-col gap-2">
        <div className="tech-label text-[#00FFF2]">PHASE_02 // INTERACTIVE_INTERVIEW</div>
        <h2 className="font-serif italic text-4xl text-white underline decoration-[#00FFF2]/30 decoration-4 underline-offset-8">
           Knowledge Synthesis & Project Refinement
        </h2>
        <p className="font-mono text-[10px] text-dim mt-4 uppercase tracking-[0.2em]">
           Subject must prove conceptual alignment and implement suggested technical modifications live.
        </p>
      </div>

      <div className="flex flex-col gap-16">
        {/* Concept Questions */}
        <div className="flex flex-col gap-8">
          <h3 className="tech-label text-white flex items-center gap-3">
             <Book className="w-3 h-3" /> [ 01 ] // CONCEPTUAL_VECTORS
          </h3>
          <div className="grid grid-cols-1 gap-8">
            {interview.concept_questions.map((q: string, i: number) => (
              <div key={i} className="flex flex-col gap-4">
                <p className="font-serif italic text-lg text-white/80">{q}</p>
                <textarea 
                  value={answers.concept[i]}
                  onChange={(e) => setAnswers({...answers, concept: answers.concept.map((v: string, idx: number) => idx === i ? e.target.value : v)})}
                  placeholder="Analyze and respond..."
                  className="w-full bg-black/50 border border-subtle p-6 text-sm text-white focus:border-[#00FFF2] outline-none transition-all font-mono min-h-[100px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Task Questions */}
        <div className="flex flex-col gap-8 border-t border-subtle pt-16">
          <h3 className="tech-label text-white flex items-center gap-3">
             <CheckCircle2 className="w-3 h-3" /> [ 02 ] // IMPLEMENTATION_STRATEGY
          </h3>
          <div className="grid grid-cols-1 gap-8">
            {interview.task_specific_questions.map((q: string, i: number) => (
              <div key={i} className="flex flex-col gap-4">
                <p className="font-serif italic text-lg text-white/80">{q}</p>
                <textarea 
                  value={answers.task[i]}
                  onChange={(e) => setAnswers({...answers, task: answers.task.map((v: string, idx: number) => idx === i ? e.target.value : v)})}
                  placeholder="Explain your architectural choices..."
                  className="w-full bg-black/50 border border-subtle p-6 text-sm text-white focus:border-[#00FFF2] outline-none transition-all font-mono min-h-[100px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modification Questions */}
        <div className="flex flex-col gap-8 border-t border-subtle pt-16">
          <h3 className="tech-label text-white flex items-center gap-3">
             <TerminalIcon className="w-3 h-3" /> [ 03 ] // CODE_MODIFICATION_STREAM
          </h3>
          <div className="grid grid-cols-1 gap-12">
            {interview.technical_modifications.map((m: any, i: number) => (
              <div key={i} className="flex flex-col gap-6 p-8 bg-black/40 border border-subtle">
                <div className="flex flex-col gap-2">
                   <p className="font-serif italic text-xl text-white">{m.question}</p>
                   <span className="tech-label text-[8px] text-[#00FFF2]">Targeted Snippet for Refactoring:</span>
                </div>
                <div className="font-mono text-[11px] bg-[#0A0A0A] p-6 text-[#00FFF2]/80 border-l-2 border-[#00FFF2]">
                   {m.original_snippet}
                </div>
                <textarea 
                  value={answers.modifications[i]}
                  onChange={(e) => setAnswers({...answers, modifications: answers.modifications.map((v: string, idx: number) => idx === i ? e.target.value : v)})}
                  placeholder="Apply modifications and push optimized logic..."
                  className="w-full bg-[#050505] border border-subtle p-6 text-[12px] text-[#00FFF2] focus:border-[#00FFF2] outline-none transition-all font-mono min-h-[150px]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={isSubmitting}
        className="w-full py-8 bg-[#00FFF2] text-black font-sans font-black tracking-ultra uppercase text-sm hover:bg-white transition-all shadow-[0_0_40px_rgba(0,255,242,0.3)] mt-12"
      >
        {isSubmitting ? "FINALIZING_EVALUATION..." : "EXECUTE_FINAL_SYNTHESIS"}
      </button>
    </motion.div>
  );
}

function ModuleViewer({ project, modules, onBack }: { project: Project, modules: Module[], onBack: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(project.current_module - 1);
  const [githubUrl, setGithubUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentModule = modules[currentIdx];

  const handleSubmitTask = async () => {
    if (!githubUrl) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "projects", project.id), {
        github_url: githubUrl,
        status: "task_submitted",
        updatedAt: serverTimestamp(),
      });
      setIsSubmitting(false);
      setIsEvaluating(true);
      const result = await validationAgent(githubUrl, currentModule.task.description);
      
      await updateDoc(doc(db, "projects", project.id), {
        task_score: result.task_score,
        feedback: result.feedback,
        interview: result.interview,
        status: "interview_ready",
        updatedAt: serverTimestamp(),
      });
      setIsEvaluating(false);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setIsEvaluating(false);
    }
  };

  const handleNextPhase = async () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= modules.length) {
      await updateDoc(doc(db, "projects", project.id), {
        status: "report_generated",
        updatedAt: serverTimestamp(),
      });
      onBack();
      return;
    }

    try {
      await updateDoc(doc(db, "projects", project.id), {
        current_module: nextIdx + 1,
        status: "course_ready",
        github_url: "",
        final_score: null,
        feedback: null,
        interview: null,
        updatedAt: serverTimestamp(),
      });
      setCurrentIdx(nextIdx);
      setGithubUrl("");
    } catch (error) {
       console.error("Failed to advance phase", error);
    }
  };

  const handleReinitiate = async () => {
    try {
      await updateDoc(doc(db, "projects", project.id), {
        status: "course_ready",
        github_url: "",
        final_score: null,
        feedback: null,
        interview: null,
        updatedAt: serverTimestamp(),
      });
      setGithubUrl("");
    } catch (error) {
       console.error("Failed to re-initiate", error);
    }
  };

  const handleCompleteInterview = async (answers: any) => {
    try {
      await updateDoc(doc(db, "projects", project.id), {
        status: "interview_phase",
        updatedAt: serverTimestamp(),
      });

      const result = await interviewEvaluationAgent(project.task_score || 0, project.interview, answers);

      await updateDoc(doc(db, "projects", project.id), {
        interview_score: result.interview_score,
        final_score: result.final_score,
        feedback: result.feedback,
        status: "evaluation_done",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Interview evaluation failed", error);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto">
      <button onClick={onBack} className="tech-label text-dim hover:text-[#00FFF2] flex items-center gap-2 transition-colors">
         <ChevronRight className="w-3 h-3 rotate-180" /> EXIT_TO_DASHBOARD
      </button>

      {modules.length === 0 ? (
        <div className="text-center py-20 font-mono text-xs text-dim animate-pulse">SYNCHRONIZING_MODULE_DATA...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Sidebar Nav */}
          <div className="flex flex-col gap-px bg-subtle border border-subtle overflow-y-auto md:max-h-[80vh] md:sticky md:top-10 custom-scrollbar">
             <div className="p-4 bg-white/[0.03] border-b border-subtle">
                <p className="tech-label text-dim">MODULE_INDEX</p>
             </div>
             {modules.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`flex flex-col gap-2 p-6 transition-all text-left group ${
                    currentIdx === i ? "bg-[#00FFF2]/5 border-l-2 border-l-[#00FFF2]" : "bg-[#0A0A0A] hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`tech-label ${currentIdx === i ? "text-[#00FFF2]" : "text-dim"}`}>0{i + 1}</span>
                    {i < currentIdx && <CheckCircle2 className="w-3 h-3 text-[#00FFF2]" />}
                  </div>
                  <span className={`font-serif italic text-sm ${currentIdx === i ? "text-white" : "text-dim"}`}>{m.module_title}</span>
                </button>
             ))}
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 flex flex-col gap-10">
             <motion.div 
               key={currentModule.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-8"
             >
                <div className="flex flex-col gap-2 border-b border-subtle pb-8">
                   <div className="tech-label text-[#00FFF2]">CURRENT_MODULE_ACTIVE</div>
                   <h2 className="font-serif italic text-5xl text-white tracking-tight">{currentModule.module_title}</h2>
                </div>
                
                <div className="flex flex-col gap-10">
                   <div className="flex flex-col gap-4">
                      <span className="tech-label text-dim">Abstraction_Introduction</span>
                      <p className="font-serif italic text-xl text-white/90 leading-relaxed max-w-3xl">{currentModule.content.intro}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-subtle">
                      <div className="flex flex-col gap-4">
                        <span className="tech-label text-dim">Deep_System_Explanation</span>
                        <p className="text-sm text-dim leading-relaxed font-sans whitespace-pre-wrap">{currentModule.content.deep_explanation}</p>
                      </div>
                      <div className="flex flex-col gap-4 p-8 bg-white/[0.02] border border-subtle">
                        <span className="tech-label text-[#00FFF2]">Practical_Synthesized_Examples</span>
                        <p className="text-sm text-white/70 italic font-serif leading-relaxed">" {currentModule.content.examples} "</p>
                      </div>
                   </div>
                </div>

                {/* Challenge Section */}
                <div className="mt-10 p-10 bg-white/[0.03] border border-subtle active-glow">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <Code className="text-[#00FFF2] w-4 h-4" />
                         <span className="tech-label">SYSTEM_CHALLENGE // MODULE_VALIDATION</span>
                      </div>
                      <span className="font-mono text-[9px] text-[#00FFF2]/50 tracking-widest uppercase">Target_Score: 70%+</span>
                   </div>
                   
                   <h3 className="font-serif italic text-3xl text-white mb-6 underline decoration-[#00FFF2]/30">{currentModule.task.title}</h3>
                   <p className="text-dim text-sm leading-relaxed mb-8 max-w-2xl">{currentModule.task.description}</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                      {currentModule.task.requirements.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-black/40 border border-subtle">
                           <div className="w-1.5 h-1.5 bg-[#00FFF2]/40 rounded-full" />
                           <span className="text-[11px] font-mono text-dim tracking-tight">{r}</span>
                        </div>
                      ))}
                   </div>

                   {project.status === "task_submitted" || project.status === "evaluation_running" || project.status === "interview_ready" || project.status === "interview_phase" || project.status === "evaluation_done" ? (
                      <div className="flex flex-col gap-8 p-10 border border-[#00FFF2]/30 bg-[#00FFF2]/5">
                        {project.status === "interview_ready" || project.status === "interview_phase" ? (
                           <InterviewPhase project={project} onComplete={handleCompleteInterview} />
                        ) : project.status === "evaluation_done" ? (
                           <div className="flex flex-col gap-10">
                              <div className="flex items-center justify-between">
                                 <div>
                                   <div className="tech-label text-[#00FFF2] mb-1">TERMINAL_EVALUATION_SCORE</div>
                                   <p className="font-sans text-5xl font-black text-white tracking-tighter">
                                      {project.final_score}<span className="text-xl text-dim">%</span>
                                   </p>
                                 </div>
                                 <Award className="w-12 h-12 text-[#00FFF2]" />
                              </div>

                              <div className="grid grid-cols-2 gap-4 pb-8 border-b border-white/10">
                                <div className="p-4 bg-black/20">
                                  <span className="tech-label text-dim">Submission_Score</span>
                                  <p className="font-mono text-xl text-white">{(project as any).task_score}%</p>
                                </div>
                                <div className="p-4 bg-black/20">
                                  <span className="tech-label text-dim">Interview_Sync</span>
                                  <p className="font-mono text-xl text-white">{(project as any).interview_score}%</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <span className="tech-label text-dim">Final_Agent_Insights</span>
                                <p className="font-mono text-[11px] text-white/50 bg-black/50 p-4 leading-relaxed font-italic line-clamp-3">
                                  {">"} {project.feedback}
                                </p>
                              </div>

                              {project && (project as any).interview && (
                                <div className="flex flex-col gap-4">
                                   <h4 className="tech-label text-white flex items-center gap-2">
                                      <MessageSquare className="w-3 h-3" /> Final_Evaluation_Interview
                                   </h4>
                                   <div className="grid grid-cols-1 gap-4">
                                      {Object.entries((project as any).interview).map(([key, questions]: [string, any]) => (
                                         <div key={key} className="bg-black/30 p-6 border border-subtle">
                                            <p className="tech-label text-dim text-[8px] mb-4">{key}</p>
                                            <ul className="flex flex-col gap-4">
                                               {questions.map((q: string, i: number) => (
                                                  <li key={i} className="text-[11px] font-mono text-white/60 leading-relaxed border-l border-[#00FFF2]/20 pl-4">{q}</li>
                                               ))}
                                            </ul>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                              <div className="flex gap-4">
                                {project.final_score && project.final_score >= 70 ? (
                                  <button 
                                    onClick={handleNextPhase}
                                    className="flex-1 py-5 bg-[#00FFF2] text-black font-sans font-black tracking-ultra uppercase text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,242,0.2)]"
                                  >
                                    Initialize Next Phase
                                  </button>
                                ) : (
                                  <button 
                                    onClick={handleReinitiate}
                                    className="flex-1 py-5 border border-red-500/50 text-red-400 font-sans font-black tracking-ultra uppercase text-xs hover:bg-red-500 hover:text-white transition-all"
                                  >
                                    Re-Initiate Module
                                  </button>
                                )}
                              </div>
                           </div>
                        ) : (
                           <div className="flex items-center gap-6 py-10 justify-center">
                              <div className="w-6 h-6 border-2 border-[#00FFF2] border-t-transparent animate-spin rounded-full"></div>
                              <p className="tech-label animate-pulse">AGENT_VALIDATION_IN_PROGRESS...</p>
                           </div>
                        )}
                      </div>
                   ) : (
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                           <Github className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                           <input 
                             type="text" 
                             value={githubUrl}
                             onChange={(e) => setGithubUrl(e.target.value)}
                             placeholder="[ GITHUB_REPO_URL ]"
                             className="w-full h-16 pl-14 pr-6 bg-[#0A0A0A] border border-subtle text-sm text-white focus:border-[#00FFF2] outline-none transition-all placeholder:text-dim/20 font-mono"
                           />
                        </div>
                        <button 
                          onClick={handleSubmitTask}
                          disabled={isSubmitting || !githubUrl}
                          className="px-10 h-16 bg-white text-black font-sans font-black tracking-ultra uppercase text-xs hover:bg-[#00FFF2] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                          {isSubmitting ? "SYNC..." : "SUBMIT_FOR_EVAL"}
                        </button>
                      </div>
                   )}
                </div>
             </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
