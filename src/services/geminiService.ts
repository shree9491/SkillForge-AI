import { GoogleGenAI, Type } from "@google/genai";
import { RequirementPlan, Module, ValidationResult } from "../types";

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.warn("GEMINI_API_KEY is not defined in the environment. Please check your secrets.");
}
const ai = new GoogleGenAI({ apiKey: key || "" });

export async function requirementAgent(goalText: string): Promise<RequirementPlan> {
  console.log("requirementAgent: Generating mission requirement for goal:", goalText);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following business goal and extract a structured skill mission.
      Goal: ${goalText}
      
      Return a JSON with:
      - mission_title: short catchy title
      - skills: array of specific technical skills
      - strategic_rationale: why these skills matter
      - difficulty: 'junior' | 'mid' | 'senior'`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mission_title: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategic_rationale: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['junior', 'mid', 'senior'] }
          },
          required: ["mission_title", "skills", "strategic_rationale", "difficulty"]
        }
      }
    });

    console.log("requirementAgent: Generation successful");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("requirementAgent: Generation failed", error);
    throw error;
  }
}

export async function courseAgent(approvedPlan: RequirementPlan): Promise<Module[]> {
  console.log("courseAgent: Generating modules for plan:", approvedPlan.mission_title);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3-5 learning modules for the following skill plan: ${JSON.stringify(approvedPlan)}
      Each module should be progressive.
      Return an array of objects:
      - module_title: title
      - content: { intro: string, deep_explanation: string, examples: string }
      - task: { title: string, description: string, requirements: string[] }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              module_title: { type: Type.STRING },
              content: {
                type: Type.OBJECT,
                properties: {
                  intro: { type: Type.STRING },
                  deep_explanation: { type: Type.STRING },
                  examples: { type: Type.STRING }
                }
              },
              task: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            required: ["module_title", "content", "task"]
          }
        }
      }
    });

    console.log("courseAgent: Generation successful");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("courseAgent: Generation failed", error);
    throw error;
  }
}

export async function validationAgent(githubUrl: string, taskDescription: string): Promise<ValidationResult> {
  console.log("validationAgent: Validating submission for:", githubUrl);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simulate a code review for this GitHub repo (URL: ${githubUrl}) against this task: ${taskDescription}
      Evaluate purely based on technical heuristics.
      
      Return JSON:
      - task_score: 0-100 (initial score for the submitted code)
      - feedback: string (brief technical feedback)
      - interview: {
          concept_questions: string[5] (5 fundamental concept questions related to the technology used),
          task_specific_questions: string[5] (5 questions about the implementation choices in this specific task),
          technical_modifications: object[5] (5 items each with 'question' and 'original_snippet' which is a code snippet from the expected implementation that needs improvement or modification)
        }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task_score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            interview: {
              type: Type.OBJECT,
              properties: {
                concept_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                task_specific_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                technical_modifications: { 
                  type: Type.ARRAY, 
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      original_snippet: { type: Type.STRING }
                    },
                    required: ["question", "original_snippet"]
                  }
                }
              },
              required: ["concept_questions", "task_specific_questions", "technical_modifications"]
            }
          },
          required: ["task_score", "feedback", "interview"]
        }
      }
    });

    console.log("validationAgent: Generation successful");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("validationAgent: Generation failed", error);
    throw error;
  }
}

export async function interviewEvaluationAgent(
  taskScore: number,
  interviewData: any,
  answers: any
): Promise<{ interview_score: number, final_score: number, feedback: string }> {
  console.log("interviewEvaluationAgent: Finalizing evaluation");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate the user's interview performance.
      Initial Task Score: ${taskScore}%
      Interview Questions: ${JSON.stringify(interviewData)}
      User Answers: ${JSON.stringify(answers)}
      
      Calculate:
      - interview_score: 0-100 (based on quality of answers and code modifications)
      - final_score: weighted average of task_score and interview_score
      - feedback: final technical feedback including comments on the modifications
      
      Return JSON:
      {
        "interview_score": number,
        "final_score": number,
        "feedback": string
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interview_score: { type: Type.NUMBER },
            final_score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["interview_score", "final_score", "feedback"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("interviewEvaluationAgent failed", error);
    throw error;
  }
}
