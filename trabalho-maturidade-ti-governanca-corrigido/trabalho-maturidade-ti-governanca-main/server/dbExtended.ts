import { getDb } from "./db";
import {
  assessmentResults,
  actionPlans,
  accessLogs,
  assessmentHistory,
  categories,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Save AI recommendations and gaps to assessment result
 */
export async function saveAIRecommendationsAndGaps(
  assessmentId: number,
  recommendations: any,
  gaps: any,
  targetMaturityLevel: number = 5
) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db
    .update(assessmentResults)
    .set({
      aiRecommendations: JSON.stringify(recommendations),
      maturityGaps: JSON.stringify(gaps),
      targetMaturityLevel,
    })
    .where(eq(assessmentResults.assessmentId, assessmentId));
}

/**
 * Get AI recommendations and gaps for an assessment
 */
export async function getAIRecommendationsAndGaps(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  const result = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.assessmentId, assessmentId))
    .limit(1);

  if (!result.length) return null;

  const data = result[0];
  return {
    recommendations: data.aiRecommendations
      ? JSON.parse(data.aiRecommendations)
      : null,
    gaps: data.maturityGaps ? JSON.parse(data.maturityGaps) : null,
    targetMaturityLevel: data.targetMaturityLevel,
  };
}

/**
 * Create an action plan (5W2H)
 */
export async function createActionPlan(input: {
  assessmentId: number;
  title: string;
  description?: string;
  what: string;
  why: string;
  where_location: string;
  when_date?: Date;
  who?: string;
  how: string;
  how_much?: number;
  priority?: "baixa" | "media" | "alta" | "critica";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db.insert(actionPlans).values({
    assessmentId: input.assessmentId,
    title: input.title,
    description: input.description,
    what: input.what,
    why: input.why,
    where_location: input.where_location,
    when_date: input.when_date,
    who: input.who,
    how: input.how,
    how_much: input.how_much ? parseFloat(input.how_much.toString()) : null,
    priority: input.priority || "media",
  });
}

/**
 * Get action plans for an assessment
 */
export async function getActionPlansByAssessmentId(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db
    .select()
    .from(actionPlans)
    .where(eq(actionPlans.assessmentId, assessmentId))
    .orderBy(desc(actionPlans.priority));
}

/**
 * Update action plan status
 */
export async function updateActionPlanStatus(
  planId: number,
  status: "planejado" | "em_progresso" | "concluido" | "cancelado"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db
    .update(actionPlans)
    .set({ status })
    .where(eq(actionPlans.id, planId));
}

/**
 * Log user access for audit trail
 */
export async function logUserAccess(input: {
  userId: number;
  action: string;
  resource?: string;
  resourceId?: number;
  status?: "sucesso" | "falha";
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db.insert(accessLogs).values({
    userId: input.userId,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    status: input.status || "sucesso",
    details: input.details ? JSON.stringify(input.details) : null,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

/**
 * Get access logs for a user
 */
export async function getUserAccessLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.userId, userId))
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Save assessment to history
 */
export async function saveAssessmentToHistory(
  companyId: number,
  assessmentId: number,
  overallScore: number,
  overallMaturityLevel: number,
  categoryScores: Record<number, number>,
  categoryMaturityLevels: Record<number, number>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db.insert(assessmentHistory).values({
    companyId,
    assessmentId,
    overallScore: parseFloat(overallScore.toString()),
    overallMaturityLevel,
    categoryScores: JSON.stringify(categoryScores),
    categoryMaturityLevels: JSON.stringify(categoryMaturityLevels),
  });
}

/**
 * Get assessment history for a company
 */
export async function getCompanyAssessmentHistory(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db
    .select()
    .from(assessmentHistory)
    .where(eq(assessmentHistory.companyId, companyId))
    .orderBy(desc(assessmentHistory.createdAt));
}

/**
 * Get categories with COBIT domain information
 */
export async function getCategoriesWithCobitDomain() {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db.select().from(categories).orderBy(categories.order);
}

/**
 * Update category with COBIT domain
 */
export async function updateCategoryCobitDomain(
  categoryId: number,
  cobitDomain: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not configured");

  return await db
    .update(categories)
    .set({ cobitDomain })
    .where(eq(categories.id, categoryId));
}
