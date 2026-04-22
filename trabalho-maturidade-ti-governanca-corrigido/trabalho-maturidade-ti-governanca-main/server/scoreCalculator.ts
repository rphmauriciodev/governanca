import { getAssessmentAnswers, getAllCategories, getQuestionsByCategoryId } from './db.js';

export interface CategoryScore {
  categoryId: number;
  categoryName: string;
  score: number;
  maturityLevel: number;
  weight: number;
}

export interface AssessmentScore {
  overallScore: number;
  overallMaturityLevel: number;
  categoryScores: Record<number, number>;
  categoryMaturityLevels: Record<number, number>;
  categoryDetails: CategoryScore[];
}

/**
 * Calculate maturity level from score (1-5 scale)
 * Score range: 1.0 - 5.0
 * Levels:
 * 1.0 - 1.8: Level 1 (Initial)
 * 1.8 - 2.6: Level 2 (Repeatable)
 * 2.6 - 3.4: Level 3 (Defined)
 * 3.4 - 4.2: Level 4 (Managed)
 * 4.2 - 5.0: Level 5 (Optimized)
 */
export function scoreToMaturityLevel(score: number): number {
  if (score < 1.8) return 1;
  if (score < 2.6) return 2;
  if (score < 3.4) return 3;
  if (score < 4.2) return 4;
  return 5;
}

/**
 * Get description for maturity level
 */
export function getMaturityLevelDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: "Inicial - Processos caóticos e não documentados",
    2: "Repetível - Processos básicos estabelecidos",
    3: "Definido - Processos documentados e comunicados",
    4: "Gerenciado - Processos medidos e controlados",
    5: "Otimizado - Processos continuamente melhorados",
  };
  return descriptions[level] || "Desconhecido";
}

/**
 * Calculate assessment scores
 */
export async function calculateAssessmentScore(assessmentId: number): Promise<AssessmentScore> {
  const answers = await getAssessmentAnswers(assessmentId);
  const categories = await getAllCategories();

  if (answers.length === 0) {
    throw new Error("Nenhuma resposta encontrada para esta avaliação");
  }

  // Group answers by category
  const answersByCategory: Record<number, { scores: number[]; weight: number }> = {};

  for (const category of categories) {
    answersByCategory[category.id] = {
      scores: [],
      weight: parseFloat(category.weight as unknown as string),
    };
  }

  // Populate scores
  for (const answer of answers) {
    const question = await getQuestionById(answer.questionId);
    if (question && answersByCategory[question.categoryId]) {
      answersByCategory[question.categoryId].scores.push(answer.score);
    }
  }

  // Calculate category scores
  const categoryScores: Record<number, number> = {};
  const categoryMaturityLevels: Record<number, number> = {};
  const categoryDetails: CategoryScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const category of categories) {
    const categoryData = answersByCategory[category.id];
    if (categoryData.scores.length > 0) {
      const avgScore =
        categoryData.scores.reduce((a, b) => a + b, 0) / categoryData.scores.length;
      const maturityLevel = scoreToMaturityLevel(avgScore);

      categoryScores[category.id] = parseFloat(avgScore.toFixed(2));
      categoryMaturityLevels[category.id] = maturityLevel;

      totalWeightedScore += avgScore * categoryData.weight;
      totalWeight += categoryData.weight;

      categoryDetails.push({
        categoryId: category.id,
        categoryName: category.name,
        score: parseFloat(avgScore.toFixed(2)),
        maturityLevel,
        weight: categoryData.weight,
      });
    }
  }

  // Calculate overall score
  const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const overallMaturityLevel = scoreToMaturityLevel(overallScore);

  return {
    overallScore: parseFloat(overallScore.toFixed(2)),
    overallMaturityLevel,
    categoryScores,
    categoryMaturityLevels,
    categoryDetails,
  };
}

/**
 * Get recommendations based on maturity level
 */
export function getRecommendations(maturityLevel: number): string[] {
  const recommendations: Record<number, string[]> = {
    1: [
      "Estabelecer processos básicos de TI",
      "Documentar procedimentos operacionais",
      "Definir responsabilidades e papéis",
      "Implementar controles básicos",
    ],
    2: [
      "Padronizar processos existentes",
      "Criar políticas e procedimentos formais",
      "Implementar treinamento para equipes",
      "Estabelecer métricas básicas",
    ],
    3: [
      "Integrar processos de TI com negócio",
      "Implementar governança de TI",
      "Estabelecer comitês de decisão",
      "Documentar e comunicar estratégia de TI",
    ],
    4: [
      "Implementar monitoramento contínuo",
      "Estabelecer SLAs e KPIs",
      "Automatizar processos",
      "Implementar gestão de mudanças",
    ],
    5: [
      "Implementar inovação contínua",
      "Otimizar processos automatizados",
      "Analisar tendências e benchmarks",
      "Investir em novas tecnologias",
    ],
  };

  return recommendations[maturityLevel] || [];
}

// Import getQuestionById for use in this file
async function getQuestionById(id: number) {
  const { getQuestionById: getQuestion } = await import("./db");
  return getQuestion(id);
}
