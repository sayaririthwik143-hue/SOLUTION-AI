import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  impact: string;
  impactLevel: 'Low' | 'Medium' | 'High';
  isAgentSuitable: boolean;
  domain: string;
}

export interface Solution {
  concept: string;
  features: string[];
  techStack: string[];
  targetAudience: string;
  isAgentBased: boolean;
  agentCapabilities?: string[];
  agentIntegrations?: string[];
}

export interface DomainTrend {
  domain: string;
  intensity: number;
  growth: number;
}

export async function getDomainTrends(): Promise<DomainTrend[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze current global innovation trends and provide a list of 6 high-growth domains for software and AI development (e.g., "Sports Analytics", "Personalized Fitness", "Green Energy"). 
    For each domain, provide:
    1. domain: The name of the domain (e.g., "Green Energy", "Telemedicine")
    2. intensity: A value from 1-100 representing current problem density.
    3. growth: A value from 1-100 representing year-over-year interest growth.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            domain: { type: Type.STRING },
            intensity: { type: Type.NUMBER },
            growth: { type: Type.NUMBER },
          },
          required: ["domain", "intensity", "growth"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse domain trends:", e);
    return [];
  }
}

export interface SearchResult {
  problems: Problem[];
  subDomains: string[];
}

export async function searchDomain(domain: string): Promise<SearchResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the "${domain}" domain and provide:
    1. A list of 5 real-world problems that could be solved with software/AI. Focus on specific, non-obvious pain points.
    2. A list of 5 specific sub-domains or niches currently seeing innovation.
    
    For each problem:
    - Assign an impactLevel: 'Low', 'Medium', or 'High'.
    - Determine isAgentSuitable: true if well-suited for an autonomous AI agent.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impact: { type: Type.STRING },
                impactLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                isAgentSuitable: { type: Type.BOOLEAN },
                domain: { type: Type.STRING },
              },
              required: ["id", "title", "description", "impact", "impactLevel", "isAgentSuitable", "domain"],
            },
          },
          subDomains: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["problems", "subDomains"]
      },
    },
  });

  try {
    return JSON.parse(response.text || '{"problems":[], "subDomains":[]}');
  } catch (e) {
    console.error("Failed to parse search results:", e);
    return { problems: [], subDomains: [] };
  }
}

export async function getTrendingProblems(): Promise<Problem[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify 5 of the most trending and high-impact real-world problems globally across various domains (e.g., Sports, Fitness, Climate, Healthcare, AI, Logistics, Energy). Focus on problems that are ripe for software or AI agent solutions. 
    For each problem:
    1. Assign an impactLevel: 'Low', 'Medium', or 'High'.
    2. Determine isAgentSuitable: true if the problem is particularly well-suited for an autonomous AI agent or specialized AI assistant to solve.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            impact: { type: Type.STRING },
            impactLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            isAgentSuitable: { type: Type.BOOLEAN },
            domain: { type: Type.STRING },
          },
          required: ["id", "title", "description", "impact", "impactLevel", "isAgentSuitable", "domain"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse trending problems:", e);
    return [];
  }
}

export async function generateSolution(problem: Problem): Promise<Solution | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Propose a software solution for the following problem:
    Title: ${problem.title}
    Description: ${problem.description}
    Impact: ${problem.impact}
    Domain: ${problem.domain}
    
    If the problem is suitable for an Autonomous AI Agent or a specialized AI assistant, design it as an "AI Agent" solution.
    Provide a creative and feasible solution concept.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          techStack: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          targetAudience: { type: Type.STRING },
          isAgentBased: { type: Type.BOOLEAN, description: "Whether the solution is primarily an AI Agent or Autonomous Assistant" },
          agentCapabilities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "If it's an agent, what are its autonomous capabilities?"
          },
          agentIntegrations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "If it's an agent, what external systems or APIs does it integrate with?"
          },
        },
        required: ["concept", "features", "techStack", "targetAudience", "isAgentBased"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "null");
  } catch (e) {
    console.error("Failed to parse solution:", e);
    return null;
  }
}
