import { describe, expect, it } from "vitest";
import { scoreToMaturityLevel, getMaturityLevelDescription, getRecommendations } from "./scoreCalculator";

describe("Score Calculator", () => {
  describe("scoreToMaturityLevel", () => {
    it("should return level 1 for scores below 1.8", () => {
      expect(scoreToMaturityLevel(1.0)).toBe(1);
      expect(scoreToMaturityLevel(1.5)).toBe(1);
      expect(scoreToMaturityLevel(1.79)).toBe(1);
    });

    it("should return level 2 for scores between 1.8 and 2.6", () => {
      expect(scoreToMaturityLevel(1.8)).toBe(2);
      expect(scoreToMaturityLevel(2.0)).toBe(2);
      expect(scoreToMaturityLevel(2.59)).toBe(2);
    });

    it("should return level 3 for scores between 2.6 and 3.4", () => {
      expect(scoreToMaturityLevel(2.6)).toBe(3);
      expect(scoreToMaturityLevel(3.0)).toBe(3);
      expect(scoreToMaturityLevel(3.39)).toBe(3);
    });

    it("should return level 4 for scores between 3.4 and 4.2", () => {
      expect(scoreToMaturityLevel(3.4)).toBe(4);
      expect(scoreToMaturityLevel(3.8)).toBe(4);
      expect(scoreToMaturityLevel(4.19)).toBe(4);
    });

    it("should return level 5 for scores 4.2 and above", () => {
      expect(scoreToMaturityLevel(4.2)).toBe(5);
      expect(scoreToMaturityLevel(4.5)).toBe(5);
      expect(scoreToMaturityLevel(5.0)).toBe(5);
    });
  });

  describe("getMaturityLevelDescription", () => {
    it("should return correct descriptions for each level", () => {
      expect(getMaturityLevelDescription(1)).toContain("Inicial");
      expect(getMaturityLevelDescription(2)).toContain("Repetível");
      expect(getMaturityLevelDescription(3)).toContain("Definido");
      expect(getMaturityLevelDescription(4)).toContain("Gerenciado");
      expect(getMaturityLevelDescription(5)).toContain("Otimizado");
    });

    it("should return unknown for invalid levels", () => {
      expect(getMaturityLevelDescription(0)).toBe("Desconhecido");
      expect(getMaturityLevelDescription(6)).toBe("Desconhecido");
    });
  });

  describe("getRecommendations", () => {
    it("should return recommendations for level 1", () => {
      const recs = getRecommendations(1);
      expect(recs).toHaveLength(4);
      expect(recs[0]).toContain("processos básicos");
    });

    it("should return recommendations for level 2", () => {
      const recs = getRecommendations(2);
      expect(recs).toHaveLength(4);
      expect(recs[0]).toContain("Padronizar");
    });

    it("should return recommendations for level 3", () => {
      const recs = getRecommendations(3);
      expect(recs).toHaveLength(4);
      expect(recs[0]).toContain("Integrar");
    });

    it("should return recommendations for level 4", () => {
      const recs = getRecommendations(4);
      expect(recs).toHaveLength(4);
      expect(recs[0]).toContain("monitoramento");
    });

    it("should return recommendations for level 5", () => {
      const recs = getRecommendations(5);
      expect(recs).toHaveLength(4);
      expect(recs[0]).toContain("inovação");
    });

    it("should return empty array for invalid levels", () => {
      expect(getRecommendations(0)).toEqual([]);
      expect(getRecommendations(6)).toEqual([]);
    });
  });
});
