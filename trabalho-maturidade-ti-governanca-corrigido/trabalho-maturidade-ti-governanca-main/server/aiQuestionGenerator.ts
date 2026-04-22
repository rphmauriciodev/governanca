import { invokeLLM } from './_core/llm.js';
import { createQuestion, getCategoryById } from './db.js';

/**
 * Framework definitions for IT maturity assessment
 */
export const MATURITY_FRAMEWORKS = {
  CMMI: {
    name: "CMMI (Capability Maturity Model Integration)",
    levels: ["Inicial", "Repetível", "Definido", "Gerenciado", "Otimizado"],
    areas: [
      "Gestão de Requisitos",
      "Planejamento de Projeto",
      "Monitoramento e Controle",
      "Gestão de Configuração",
      "Garantia de Qualidade",
      "Análise e Resolução de Causas",
    ],
  },
  ITIL: {
    name: "ITIL (Information Technology Infrastructure Library)",
    levels: ["Inicial", "Repetível", "Definido", "Gerenciado", "Otimizado"],
    areas: [
      "Gestão de Serviços",
      "Gestão de Incidentes",
      "Gestão de Mudanças",
      "Gestão de Problemas",
      "Gestão de Capacidade",
      "Gestão de Continuidade",
    ],
  },
  ISO: {
    name: "ISO/IEC 27001 (Segurança da Informação)",
    levels: ["Inicial", "Repetível", "Definido", "Gerenciado", "Otimizado"],
    areas: [
      "Políticas de Segurança",
      "Controle de Acesso",
      "Criptografia",
      "Gestão de Incidentes",
      "Conformidade",
      "Auditoria",
    ],
  },
};

export interface GeneratedQuestion {
  text: string;
  category: string;
  framework: string;
  difficulty: number;
  weight: number;
}

/**
 * Generate intelligent questions using LLM based on maturity framework
 */
export async function generateQuestionsWithAI(input: {
  categoryId: number;
  framework: keyof typeof MATURITY_FRAMEWORKS;
  count: number;
  companyContext?: string;
}): Promise<GeneratedQuestion[]> {
  const frameworkData = MATURITY_FRAMEWORKS[input.framework];

  const prompt = `
Você é um especialista em avaliação de maturidade de TI. 
Gere ${input.count} perguntas de avaliação baseadas no framework ${frameworkData.name}.

Contexto:
- Áreas de foco: ${frameworkData.areas.join(", ")}
- Níveis de maturidade: ${frameworkData.levels.join(", ")}
${input.companyContext ? `- Contexto da empresa: ${input.companyContext}` : ""}

Requisitos para cada pergunta:
1. Deve ser clara e objetiva
2. Deve avaliar um aspecto específico de maturidade
3. Deve ter uma dificuldade (1-5, onde 1 é básico e 5 é avançado)
4. Deve ter um peso (1-10, onde 10 é mais importante)

Retorne um JSON com array de objetos contendo:
{
  "text": "pergunta clara e específica",
  "difficulty": número de 1-5,
  "weight": número de 1-10,
  "area": "área específica do framework"
}

Gere exatamente ${input.count} perguntas, variando em dificuldade e cobrindo diferentes áreas.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em avaliação de maturidade de TI e frameworks de governança. Responda sempre em JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    
    // Suporta tanto { questions: [] } quanto [] diretamente
    const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
    
    const result: GeneratedQuestion[] = [];

    // Salva cada questão no banco de dados
    for (const q of questions) {
      const questionData = {
        categoryId: input.categoryId,
        text: q.text,
        description: `Área: ${q.area} (Gerada via IA - ${input.framework})`,
        weight: (q.weight || 5).toString(),
        order: 0,
      };

      await createQuestion(questionData);

      result.push({
        text: q.text,
        category: q.area,
        framework: input.framework,
        difficulty: Math.min(5, Math.max(1, q.difficulty || 3)),
        weight: Math.min(10, Math.max(1, q.weight || 5)),
      });
    }

    return result;
  } catch (error) {
    console.error("Error generating questions with AI:", error);
    throw new Error("Failed to generate questions with AI");
  }
}

/**
 * Analyze assessment answers using AI to provide contextual insights
 */
export async function analyzeAnswersWithAI(input: {
  companyName: string;
  industry: string;
  answers: Array<{
    question: string;
    answer: number;
    weight: number;
  }>;
  categoryScores: Record<number, number>;
}): Promise<{
  insights: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
}> {
  const prompt = `
Analise os seguintes dados de avaliação de maturidade de TI:

Empresa: ${input.companyName}
Indústria: ${input.industry}

Scores por Categoria: ${JSON.stringify(input.categoryScores)}

Respostas (amostra):
${input.answers
  .slice(0, 5)
  .map((a) => `- "${a.question}": ${a.answer}/5`)
  .join("\n")}

Com base nesta análise, forneça:
1. Insights gerais sobre a maturidade de TI
2. Principais pontos fortes (máximo 3)
3. Principais fraquezas (máximo 3)
4. Oportunidades de melhoria (máximo 3)
5. Riscos identificados (máximo 3)

Responda em JSON com as chaves: insights, strengths, weaknesses, opportunities, risks
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um consultor experiente em maturidade de TI. Analise criticamente e forneça insights acionáveis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return {
      insights: parsed.insights || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    };
  } catch (error) {
    console.error("Error analyzing answers with AI:", error);
    throw new Error("Failed to analyze answers with AI");
  }
}

/**
 * Generate personalized recommendations using AI
 */
export async function generateRecommendationsWithAI(input: {
  companyName: string;
  currentMaturityLevel: number;
  targetMaturityLevel: number;
  weaknesses: string[];
  industry: string;
}): Promise<{
  roadmap: string;
  quickWins: string[];
  longTermStrategy: string;
  estimatedTimeline: string;
}> {
  const prompt = `
Crie um plano de ação personalizado para melhorar a maturidade de TI:

Empresa: ${input.companyName}
Indústria: ${input.industry}
Nível Atual: ${input.currentMaturityLevel}/5
Nível Alvo: ${input.targetMaturityLevel}/5
Principais Fraquezas: ${input.weaknesses.join(", ")}

Forneça:
1. Um roadmap estratégico (2-3 parágrafos)
2. Quick wins (ações imediatas, máximo 3)
3. Estratégia de longo prazo (2-3 parágrafos)
4. Timeline estimado (em meses)

Responda em JSON com as chaves: roadmap, quickWins (array), longTermStrategy, estimatedTimeline
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um estrategista de TI experiente. Crie planos realistas e acionáveis baseados em melhores práticas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return {
      roadmap: parsed.roadmap || "",
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
      longTermStrategy: parsed.longTermStrategy || "",
      estimatedTimeline: parsed.estimatedTimeline || "",
    };
  } catch (error) {
    console.error("Error generating recommendations with AI:", error);
    throw new Error("Failed to generate recommendations with AI");
  }
}
