import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  foreignKey,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with role-based access control.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["admin", "consultor", "cliente"]).default("cliente").notNull(),
    companyId: int("companyId"), // Null for admin/consultor, set for cliente
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "users_companyId_fk",
    }).onDelete("set null"),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Companies table - stores client companies being assessed
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  size: mysqlEnum("size", ["pequena", "media", "grande"]), // Small, Medium, Large
  location: varchar("location", { length: 255 }),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Categories/Dimensions of IT Maturity
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.00").notNull(), // Weight for score calculation
  color: varchar("color", { length: 7 }).default("#3B82F6"), // For visualization
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Questions table - stores assessment questions
 */
export const questions = mysqlTable(
  "questions",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull(),
    text: text("text").notNull(),
    description: text("description"),
    weight: decimal("weight", { precision: 5, scale: 2 }).default("1.00").notNull(), // Individual question weight
    order: int("order").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "questions_categoryId_fk",
    }).onDelete("cascade"),
  ]
);

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Assessments table - stores assessment instances assigned to companies
 */
export const assessments = mysqlTable(
  "assessments",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    assignedByUserId: int("assignedByUserId").notNull(), // Admin/Consultor who assigned
    assignedToUserId: int("assignedToUserId"), // Specific user if assigned to someone
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"]).default("draft").notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "assessments_companyId_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assignedByUserId],
      foreignColumns: [users.id],
      name: "assessments_assignedByUserId_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.assignedToUserId],
      foreignColumns: [users.id],
      name: "assessments_assignedToUserId_fk",
    }).onDelete("set null"),
  ]
);

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

/**
 * Assessment Answers table - stores individual question responses
 */
export const assessmentAnswers = mysqlTable(
  "assessment_answers",
  {
    id: int("id").autoincrement().primaryKey(),
    assessmentId: int("assessmentId").notNull(),
    questionId: int("questionId").notNull(),
    score: int("score").notNull(), // 1-5 scale for maturity level
    notes: text("notes"), // Optional notes/justification
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.assessmentId],
      foreignColumns: [assessments.id],
      name: "assessmentAnswers_assessmentId_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [questions.id],
      name: "assessmentAnswers_questionId_fk",
    }).onDelete("cascade"),
  ]
);

export type AssessmentAnswer = typeof assessmentAnswers.$inferSelect;
export type InsertAssessmentAnswer = typeof assessmentAnswers.$inferInsert;

/**
 * Assessment Results table - stores calculated scores and maturity levels
 */
export const assessmentResults = mysqlTable(
  "assessment_results",
  {
    id: int("id").autoincrement().primaryKey(),
    assessmentId: int("assessmentId").notNull().unique(),
    overallScore: decimal("overallScore", { precision: 5, scale: 2 }).notNull(),
    overallMaturityLevel: int("overallMaturityLevel").notNull(), // 1-5
    categoryScores: json("categoryScores").notNull(), // JSON: { categoryId: score }
    categoryMaturityLevels: json("categoryMaturityLevels").notNull(), // JSON: { categoryId: level }
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.assessmentId],
      foreignColumns: [assessments.id],
      name: "assessmentResults_assessmentId_fk",
    }).onDelete("cascade"),
  ]
);

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = typeof assessmentResults.$inferInsert;

/**
 * Notifications table - for tracking sent notifications
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["assessment_assigned", "assessment_completed", "report_ready"]).notNull(),
    assessmentId: int("assessmentId"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    sentAt: timestamp("sentAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "notifications_userId_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assessmentId],
      foreignColumns: [assessments.id],
      name: "notifications_assessmentId_fk",
    }).onDelete("set null"),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * PDF Reports table - for tracking generated reports
 */
export const pdfReports = mysqlTable(
  "pdf_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    assessmentId: int("assessmentId").notNull(),
    generatedByUserId: int("generatedByUserId").notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileUrl: text("fileUrl").notNull(),
    llmAnalysis: text("llmAnalysis"), // LLM-generated analysis and recommendations
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.assessmentId],
      foreignColumns: [assessments.id],
      name: "pdfReports_assessmentId_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.generatedByUserId],
      foreignColumns: [users.id],
      name: "pdfReports_generatedByUserId_fk",
    }).onDelete("restrict"),
  ]
);

export type PdfReport = typeof pdfReports.$inferSelect;
export type InsertPdfReport = typeof pdfReports.$inferInsert;

/**
 * Action Plans table - stores 5W2H action plans linked to assessments
 */
export const actionPlans = mysqlTable(
  "action_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    assessmentId: int("assessmentId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    what: text("what").notNull(),
    why: text("why").notNull(),
    where_location: text("where_location").notNull(),
    when_date: timestamp("when_date"),
    who: varchar("who", { length: 255 }),
    how: text("how").notNull(),
    how_much: decimal("how_much", { precision: 10, scale: 2 }),
    priority: mysqlEnum("priority", ["baixa", "media", "alta", "critica"]).default("media").notNull(),
    status: mysqlEnum("status", ["planejado", "em_progresso", "concluido", "cancelado"]).default("planejado").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.assessmentId],
      foreignColumns: [assessments.id],
      name: "actionPlans_assessmentId_fk",
    }).onDelete("cascade"),
  ]
);

export type ActionPlan = typeof actionPlans.$inferSelect;
export type InsertActionPlan = typeof actionPlans.$inferInsert;

/**
 * Access Logs table - for audit trail and security monitoring
 */
export const accessLogs = mysqlTable(
  "access_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 255 }),
    resourceId: int("resourceId"),
    status: mysqlEnum("status", ["sucesso", "falha"]).default("sucesso").notNull(),
    details: json("details"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "accessLogs_userId_fk",
    }).onDelete("cascade"),
  ]
);

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

/**
 * Assessment History table - for tracking assessment evolution over time
 */
export const assessmentHistory = mysqlTable(
  "assessment_history",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    assessmentId: int("assessmentId"),
    overallScore: decimal("overallScore", { precision: 5, scale: 2 }).notNull(),
    overallMaturityLevel: int("overallMaturityLevel").notNull(),
    categoryScores: json("categoryScores").notNull(),
    categoryMaturityLevels: json("categoryMaturityLevels").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "assessmentHistory_companyId_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assessmentId],
      foreignColumns: [assessments.id],
      name: "assessmentHistory_assessmentId_fk",
    }).onDelete("set null"),
  ]
);

export type AssessmentHistoryRecord = typeof assessmentHistory.$inferSelect;
export type InsertAssessmentHistoryRecord = typeof assessmentHistory.$inferInsert;
