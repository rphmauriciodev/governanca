import { describe, expect, it } from "vitest";
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContextWithRole(role: "admin" | "consultor" | "cliente"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    companyId: role === "cliente" ? 1 : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Permission-based access control", () => {
  describe("Admin-only procedures", () => {
    it("should allow admin to create company", async () => {
      const ctx = createContextWithRole("admin");
      const caller = appRouter.createCaller(ctx);

      // This should not throw
      expect(async () => {
        await caller.company.create({
          name: "Test Company",
          description: "A test company",
        });
      }).not.toThrow();
    });

    it("should allow consultor to create company", async () => {
      const ctx = createContextWithRole("consultor");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.company.create({
        name: "Test Company",
        description: "A test company",
      });
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Company");
    });

    it("should deny cliente from creating company", async () => {
      const ctx = createContextWithRole("cliente");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.company.create({
          name: "Test Company",
          description: "A test company",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Consultor-only procedures", () => {
    it("should allow consultor to create assessment", async () => {
      const ctx = createContextWithRole("consultor");
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.assessment.create({
          companyId: 1,
          title: "Test Assessment",
        });
      }).not.toThrow();
    });

    it("should allow admin to create assessment", async () => {
      const ctx = createContextWithRole("admin");
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.assessment.create({
          companyId: 1,
          title: "Test Assessment",
        });
      }).not.toThrow();
    });

    it("should deny cliente from creating assessment", async () => {
      const ctx = createContextWithRole("cliente");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.assessment.create({
          companyId: 1,
          title: "Test Assessment",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Protected procedures", () => {
    it("should allow authenticated user to get profile", async () => {
      const ctx = createContextWithRole("admin");
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.user.getProfile();
      }).not.toThrow();
    });

    it("should allow authenticated user to list companies", async () => {
      const ctx = createContextWithRole("cliente");
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.company.list();
      }).not.toThrow();
    });

    it("should allow authenticated user to list categories", async () => {
      const ctx = createContextWithRole("cliente");
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.category.list();
      }).not.toThrow();
    });
  });
});
