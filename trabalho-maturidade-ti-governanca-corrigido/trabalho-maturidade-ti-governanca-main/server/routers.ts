import { COOKIE_NAME } from '../shared/const.js';
import { getSessionCookieOptions } from './_core/cookies.js';
import { systemRouter } from './_core/systemRouter.js';
import { publicProcedure, router, protectedProcedure } from './_core/trpc.js';
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getUserById,
  getAllUsers,
  updateUserRole,
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  getAllQuestions,
  getQuestionsByCategoryId,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createAssessment,
  getAssessmentById,
  getAssessmentsByCompanyId,
  getAllAssessments,
  updateAssessment,
  saveAssessmentAnswer,
  getAssessmentAnswers,
  saveAssessmentResult,
  getAssessmentResult,
  createNotification,
  getUserNotifications,
  createPdfReport,
  getPdfReportByAssessmentId,
} from './db.js';
import { generateAssessmentPDF } from './pdfGenerator.js';
import { calculateAssessmentScore } from './scoreCalculator.js';
import { sendEmailNotification } from './emailNotifications.js';
import {
  generateQuestionsWithAI,
  analyzeAnswersWithAI,
  generateRecommendationsWithAI,
  MATURITY_FRAMEWORKS,
} from './aiQuestionGenerator.js';
import {
  saveAIRecommendationsAndGaps,
  getAIRecommendationsAndGaps,
  createActionPlan,
  getActionPlansByAssessmentId,
  updateActionPlanStatus,
  logUserAccess,
  saveAssessmentToHistory,
  getCompanyAssessmentHistory,
} from './dbExtended.js';
import {
  calculateMaturityGaps,
  getMaturityRecommendations,
  getAllCobitDomains,
} from './cobitFramework.js';

/**
 * Admin-only procedure - restricts access to admin users
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas administradores podem acessar este recurso",
    });
  }
  return next({ ctx });
});

/**
 * Consultor-only procedure - restricts access to consultants
 */
const consultorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "consultor" && ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas consultores podem acessar este recurso",
    });
  }
  return next({ ctx });
});

/**
 * Cliente-only procedure - restricts access to client users
 */
const clienteProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "cliente" && ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas clientes podem acessar este recurso",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  /**
   * Authentication routes
   */
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * User routes
   */
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      return user;
    }),

    list: adminProcedure.query(async () => {
      return await getAllUsers();
    }),

    updateRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["admin", "consultor", "cliente"]),
          companyId: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateUserRole(input.userId, input.role, input.companyId ?? null);
      }),
  }),

  /**
   * Company routes
   */
  company: router({
    list: protectedProcedure.query(async () => {
      return await getAllCompanies();
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const company = await getCompanyById(input.id);
      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Empresa não encontrada",
        });
      }
      return company;
    }),

    create: consultorProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          industry: z.string().optional(),
          size: z.enum(["pequena", "media", "grande"]).optional(),
          location: z.string().optional(),
          contactName: z.string().optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCompany(input);
      }),

    update: consultorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          industry: z.string().optional(),
          size: z.enum(["pequena", "media", "grande"]).optional(),
          location: z.string().optional(),
          contactName: z.string().optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateCompany(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteCompany(input.id);
      }),
  }),

  /**
   * Category routes
   */
  category: router({
    list: protectedProcedure.query(async () => {
      return await getAllCategories();
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const category = await getCategoryById(input.id);
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Categoria não encontrada",
        });
      }
      return category;
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          weight: z.string().optional(),
          color: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCategory(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          weight: z.string().optional(),
          color: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateCategory(id, data);
      }),
  }),

  /**
   * Question routes
   */
  question: router({
    list: protectedProcedure.query(async () => {
      return await getAllQuestions();
    }),

    listByCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await getQuestionsByCategoryId(input.categoryId);
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const question = await getQuestionById(input.id);
      if (!question) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Questão não encontrada",
        });
      }
      return question;
    }),

    create: adminProcedure
      .input(
        z.object({
          categoryId: z.number(),
          text: z.string().min(1),
          description: z.string().optional(),
          weight: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createQuestion(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          text: z.string().min(1).optional(),
          description: z.string().optional(),
          weight: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateQuestion(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteQuestion(input.id);
      }),
  }),

  /**
   * Assessment routes
   */
  assessment: router({
    create: consultorProcedure
      .input(
        z.object({
          companyId: z.number(),
          assignedToUserId: z.number().optional(),
          title: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const assessment = await createAssessment({
          companyId: input.companyId,
          assignedByUserId: ctx.user.id,
          assignedToUserId: input.assignedToUserId,
          title: input.title,
          description: input.description,
          status: "draft",
        });
        return assessment;
      }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const assessment = await getAssessmentById(input.id);
      if (!assessment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }
      return assessment;
    }),

    listAll: protectedProcedure.query(async () => {
      return await getAllAssessments();
    }),

    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentsByCompanyId(input.companyId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          startedAt: z.date().optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // When completing an assessment, calculate and save the score automatically
        if (data.status === "completed") {
          try {
            const score = await calculateAssessmentScore(id);
            await saveAssessmentResult({
              assessmentId: id,
              overallScore: score.overallScore.toString(),
              overallMaturityLevel: score.overallMaturityLevel,
              categoryScores: score.categoryScores,
              categoryMaturityLevels: score.categoryMaturityLevels,
            });
          } catch (err) {
            console.warn("[Assessment] Score calculation failed:", err);
          }
        }
        return await updateAssessment(id, data);
      }),

    saveAnswer: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          questionId: z.number(),
          score: z.number().min(1).max(5),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await saveAssessmentAnswer(input);
      }),

    getAnswers: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentAnswers(input.assessmentId);
      }),

    getResult: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentResult(input.assessmentId);
      }),

    generatePDF: consultorProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Avaliacao nao encontrada",
          });
        }

        const result = await generateAssessmentPDF({
          assessmentId: input.assessmentId,
          companyId: assessment.companyId,
        });

        // Opcional: Ainda registra no histórico que um relatório foi gerado
        await createPdfReport({
          assessmentId: input.assessmentId,
          generatedByUserId: ctx.user.id,
          fileName: result.fileName,
          fileUrl: "download-direto", // Marcador de que foi baixado localmente
          llmAnalysis: result.llmAnalysis,
        });

        return result;
      }),
  }),

  /**
   * Notification routes
   */
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),

    create: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          type: z.enum(["assessment_assigned", "assessment_completed", "report_ready"]),
          assessmentId: z.number().optional(),
          title: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await createNotification(input);
      }),
  }),

  /**
   * PDF Report routes
   */
  pdfReport: router({
    getByAssessment: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getPdfReportByAssessmentId(input.assessmentId);
      }),

    create: consultorProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          fileName: z.string(),
          fileUrl: z.string(),
          llmAnalysis: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createPdfReport({
          assessmentId: input.assessmentId,
          generatedByUserId: ctx.user.id,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          llmAnalysis: input.llmAnalysis,
        });
      }),
  }),

  /**
   * AI-powered features for intelligent maturity assessment
   */
  ai: router({
    generateQuestions: adminProcedure
      .input(
        z.object({
          categoryId: z.number(),
          framework: z.enum(["CMMI", "ITIL", "ISO"]),
          count: z.number().min(1).max(20),
          companyContext: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const questions = await generateQuestionsWithAI({
            categoryId: input.categoryId,
            framework: input.framework,
            count: input.count,
            companyContext: input.companyContext,
          });
          return { success: true, questions };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao gerar questões com IA",
          });
        }
      }),

    analyzeAnswers: consultorProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          companyName: z.string(),
          industry: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const answers = await getAssessmentAnswers(input.assessmentId);
          const result = await getAssessmentResult(input.assessmentId);

          if (!result) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Resultado da avaliação não encontrado",
            });
          }

          const categoryScores = typeof result.categoryScores === "string"
            ? JSON.parse(result.categoryScores)
            : result.categoryScores;

          const analysis = await analyzeAnswersWithAI({
            companyName: input.companyName,
            industry: input.industry,
            answers: answers.map((a) => ({
              question: a.questionId.toString(),
              answer: a.score,
              weight: 1,
            })),
            categoryScores,
          });

          return { success: true, analysis };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao analisar respostas com IA",
          });
        }
      }),

    generateRecommendations: consultorProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          companyName: z.string(),
          industry: z.string(),
          targetMaturityLevel: z.number().min(1).max(5),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await getAssessmentResult(input.assessmentId);

          if (!result) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Resultado da avaliação não encontrado",
            });
          }

          const recommendations = await generateRecommendationsWithAI({
            companyName: input.companyName,
            currentMaturityLevel: result.overallMaturityLevel || 1,
            targetMaturityLevel: input.targetMaturityLevel,
            weaknesses: [],
            industry: input.industry,
          });

          return { success: true, recommendations };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao gerar recomendações com IA",
          });
        }
      }),

    getFrameworks: publicProcedure.query(() => {
      return Object.entries(MATURITY_FRAMEWORKS).map(([key, value]) => ({
        id: key,
        name: value.name,
        levels: value.levels,
        areas: value.areas,
      }));
    }),

    getRecommendationsAndGaps: consultorProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        try {
          const data = await getAIRecommendationsAndGaps(input.assessmentId);
          return data || { recommendations: null, gaps: null, targetMaturityLevel: 5 };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao recuperar recomendações e gaps",
          });
        }
      }),

    saveRecommendationsAndGaps: consultorProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          recommendations: z.any(),
          gaps: z.any(),
          targetMaturityLevel: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await saveAIRecommendationsAndGaps(
            input.assessmentId,
            input.recommendations,
            input.gaps,
            input.targetMaturityLevel || 5
          );
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao salvar recomendações e gaps",
          });
        }
      }),

    getCobitDomains: publicProcedure.query(() => {
      return getAllCobitDomains();
    }),
  }),

  /**
   * Action Plan routes (5W2H)
   */
  actionPlan: router({
    create: consultorProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          what: z.string().min(1),
          why: z.string().min(1),
          where_location: z.string().min(1),
          when_date: z.date().optional(),
          who: z.string().optional(),
          how: z.string().min(1),
          how_much: z.number().optional(),
          priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await logUserAccess({
            userId: ctx.user.id,
            action: "create_action_plan",
            resource: "action_plan",
            resourceId: input.assessmentId,
          });
          return await createActionPlan(input);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criar plano de ação",
          });
        }
      }),

    listByAssessment: consultorProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getActionPlansByAssessmentId(input.assessmentId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao recuperar planos de ação",
          });
        }
      }),

    updateStatus: consultorProcedure
      .input(
        z.object({
          planId: z.number(),
          status: z.enum(["planejado", "em_progresso", "concluido", "cancelado"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await logUserAccess({
            userId: ctx.user.id,
            action: "update_action_plan_status",
            resource: "action_plan",
            resourceId: input.planId,
          });
          return await updateActionPlanStatus(input.planId, input.status);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao atualizar status do plano de ação",
          });
        }
      }),
  }),

  /**
   * Assessment History and Analytics routes
   */
  history: router({
    getCompanyHistory: consultorProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getCompanyAssessmentHistory(input.companyId);
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao recuperar histórico de avaliações",
          });
        }
      }),

    saveToHistory: consultorProcedure
      .input(
        z.object({
          companyId: z.number(),
          assessmentId: z.number(),
          overallScore: z.number(),
          overallMaturityLevel: z.number(),
          categoryScores: z.record(z.number()),
          categoryMaturityLevels: z.record(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await saveAssessmentToHistory(
            input.companyId,
            input.assessmentId,
            input.overallScore,
            input.overallMaturityLevel,
            input.categoryScores,
            input.categoryMaturityLevels
          );
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao salvar histórico",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
