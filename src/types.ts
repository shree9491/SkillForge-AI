export type UserRole = "manager" | "employee";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export type ProjectStatus = 
  | "new_project"
  | "plan_generated"
  | "plan_approved"
  | "course_ready"
  | "task_submitted"
  | "interview_ready"
  | "interview_phase"
  | "evaluation_running"
  | "evaluation_done"
  | "repeat_module"
  | "next_module"
  | "report_generated"
  | "error";

export interface Project {
  id: string;
  manager_id: string;
  employee_id?: string;
  goal_text: string;
  approved_plan?: any;
  current_module: number;
  github_url?: string;
  task_score?: number;
  interview_score?: number;
  final_score?: number;
  feedback?: string;
  interview?: {
    concept_questions: string[];
    task_specific_questions: string[];
    technical_modifications: {
      question: string;
      original_snippet: string;
    }[];
  };
  status: ProjectStatus;
  createdAt: any;
  updatedAt: any;
}

export interface RequirementPlan {
  mission_title: string;
  skills: string[];
  strategic_rationale: string;
  difficulty: 'junior' | 'mid' | 'senior';
}

export interface ValidationResult {
  task_score: number;
  feedback: string;
  interview: {
    concept_questions: string[];
    task_specific_questions: string[];
    technical_modifications: {
      question: string;
      original_snippet: string;
    }[];
  };
}

export interface Module {
  id: string;
  project_id: string;
  index: number;
  module_title: string;
  difficulty: string;
  concepts: string[];
  content: {
    intro: string;
    deep_explanation: string;
    examples: string;
  };
  task: {
    title: string;
    description: string;
    requirements: string[];
    expected_output: string;
  };
}
