import { eq, and } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  companies,
  categories,
  questions,
  assessments,
  assessmentAnswers,
  assessmentResults,
  notifications,
  pdfReports,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: any = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Configuração para suportar SSL em bancos na nuvem (Aiven, TiDB, etc)
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
      _db = drizzle(pool);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User operations
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(
  id: number,
  role: "admin" | "consultor" | "cliente",
  companyId: number | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(users).set({ role, companyId }).where(eq(users.id, id));
}

/**
 * Company operations
 */
export async function createCompany(data: typeof companies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(companies).values(data);
  // Buscar a empresa criada pelo nome
  const created = await db.select().from(companies).where(eq(companies.name, data.name)).limit(1);
  return created.length > 0 ? created[0] : null;
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(companies);
}

export async function updateCompany(id: number, data: Partial<typeof companies.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(companies).set(data).where(eq(companies.id, id));
}

/**
 * Category operations
 */
export async function createCategory(data: typeof categories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(data);
  return result;
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(categories.order);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCategory(id: number, data: Partial<typeof categories.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(categories).set(data).where(eq(categories.id, id));
}

/**
 * Question operations
 */
export async function createQuestion(data: typeof questions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(questions).values(data);
  return result;
}

export async function getQuestionsByCategoryId(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(questions)
    .where(eq(questions.categoryId, categoryId))
    .orderBy(questions.order);
}

export async function getAllQuestions() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(questions).orderBy(questions.order);
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateQuestion(id: number, data: Partial<typeof questions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(questions).set(data).where(eq(questions.id, id));
}

/**
 * Assessment operations
 */
export async function createAssessment(data: typeof assessments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(assessments).values(data);
  return result;
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAssessmentsByCompanyId(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(assessments).where(eq(assessments.companyId, companyId));
}

export async function getAllAssessments() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(assessments).orderBy(assessments.createdAt);
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(companies).where(eq(companies.id, id));
}

export async function deleteQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(questions).where(eq(questions.id, id));
}

export async function updateAssessment(id: number, data: Partial<typeof assessments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(assessments).set(data).where(eq(assessments.id, id));
}

/**
 * Assessment Answer operations
 */
export async function saveAssessmentAnswer(data: typeof assessmentAnswers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Upsert: insert or update if exists
  const existing = await db
    .select()
    .from(assessmentAnswers)
    .where(
      and(
        eq(assessmentAnswers.assessmentId, data.assessmentId),
        eq(assessmentAnswers.questionId, data.questionId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(assessmentAnswers)
      .set(data)
      .where(
        and(
          eq(assessmentAnswers.assessmentId, data.assessmentId),
          eq(assessmentAnswers.questionId, data.questionId)
        )
      );
  } else {
    return await db.insert(assessmentAnswers).values(data);
  }
}

export async function getAssessmentAnswers(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(assessmentAnswers)
    .where(eq(assessmentAnswers.assessmentId, assessmentId));
}

/**
 * Assessment Result operations
 */
export async function saveAssessmentResult(data: typeof assessmentResults.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.assessmentId, data.assessmentId))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(assessmentResults)
      .set(data)
      .where(eq(assessmentResults.assessmentId, data.assessmentId));
  } else {
    return await db.insert(assessmentResults).values(data);
  }
}

export async function getAssessmentResult(assessmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.assessmentId, assessmentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Notification operations
 */
export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications).where(eq(notifications.userId, userId));
}

/**
 * PDF Report operations
 */
export async function createPdfReport(data: typeof pdfReports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(pdfReports).values(data);
}

export async function getPdfReportByAssessmentId(assessmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(pdfReports)
    .where(eq(pdfReports.assessmentId, assessmentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
