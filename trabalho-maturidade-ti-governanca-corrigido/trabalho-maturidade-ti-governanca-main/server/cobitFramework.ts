/**
 * COBIT Framework - Governance and Management of Enterprise IT
 * Version 2019
 * 
 * This module defines the COBIT domains and their characteristics
 * for IT maturity assessment
 */

export const COBIT_DOMAINS = {
  EDM: {
    code: "EDM",
    name: "Evaluate, Direct and Monitor",
    description: "Governance domain focused on evaluation, direction and monitoring of IT initiatives",
    color: "#FF6B6B",
    processes: [
      "EDM01: Ensured Governance Framework Setting and Maintenance",
      "EDM02: Ensured Benefits Delivery",
      "EDM03: Ensured Risk Optimization",
      "EDM04: Ensured Resource Optimization",
      "EDM05: Ensured Stakeholder Transparency",
    ],
  },
  APO: {
    code: "APO",
    name: "Align, Plan and Organize",
    description: "Management domain for IT strategy alignment and planning",
    color: "#4ECDC4",
    processes: [
      "APO01: Managed IT Management Framework",
      "APO02: Managed Strategy",
      "APO03: Managed Enterprise Architecture",
      "APO04: Managed Innovation",
      "APO05: Managed Portfolio",
      "APO06: Managed Budget and Costs",
      "APO07: Managed Human Resources",
      "APO08: Managed Relationships",
      "APO09: Managed Service Agreements",
      "APO10: Managed Vendors",
      "APO11: Managed Quality",
      "APO12: Managed Risk",
      "APO13: Managed Security",
      "APO14: Managed Data",
    ],
  },
  BAI: {
    code: "BAI",
    name: "Build, Acquire and Implement",
    description: "Management domain for IT solutions development and implementation",
    color: "#45B7D1",
    processes: [
      "BAI01: Managed Programs and Projects",
      "BAI02: Managed Requirements Definition",
      "BAI03: Managed Solutions Identification and Build",
      "BAI04: Managed Availability and Capacity",
      "BAI05: Managed Organizational Change Enablement",
      "BAI06: Managed IT Changes",
      "BAI07: Managed IT Change Acceptance and Transitioning",
      "BAI08: Managed Knowledge",
      "BAI09: Managed Assets",
      "BAI10: Managed Configuration",
    ],
  },
  DSS: {
    code: "DSS",
    name: "Deliver, Service and Support",
    description: "Management domain for IT service delivery and support",
    color: "#96CEB4",
    processes: [
      "DSS01: Managed Operations",
      "DSS02: Managed Service Requests and Incidents",
      "DSS03: Managed Problems",
      "DSS04: Managed Continuity",
      "DSS05: Managed Security Services",
      "DSS06: Managed Business Process Controls",
    ],
  },
  MEA: {
    code: "MEA",
    name: "Monitor, Evaluate and Assess",
    description: "Management domain for IT performance monitoring and evaluation",
    color: "#F7DC6F",
    processes: [
      "MEA01: Managed Performance and Conformance Monitoring",
      "MEA02: Managed System of Internal Controls",
      "MEA03: Managed Compliance with External Requirements",
    ],
  },
};

export type CobitDomainCode = keyof typeof COBIT_DOMAINS;

/**
 * Get COBIT domain by code
 */
export function getCobitDomain(code: string) {
  return COBIT_DOMAINS[code as CobitDomainCode];
}

/**
 * Get all COBIT domains
 */
export function getAllCobitDomains() {
  return Object.entries(COBIT_DOMAINS).map(([code, domain]) => ({
    code,
    ...domain,
  }));
}

/**
 * Map category names to COBIT domains
 * This helps organize questions by COBIT framework
 */
export const CATEGORY_TO_COBIT_MAPPING: Record<string, CobitDomainCode> = {
  "Governance": "EDM",
  "Estratégia": "APO",
  "Planejamento": "APO",
  "Organização": "APO",
  "Desenvolvimento": "BAI",
  "Implementação": "BAI",
  "Operações": "DSS",
  "Suporte": "DSS",
  "Monitoramento": "MEA",
  "Avaliação": "MEA",
  "Conformidade": "MEA",
  "Segurança": "APO",
  "Gestão de Riscos": "EDM",
  "Gestão de Recursos": "EDM",
  "Gestão de Relacionamentos": "APO",
  "Qualidade": "APO",
};

/**
 * Maturity level descriptions for COBIT
 */
export const MATURITY_LEVELS = {
  1: {
    name: "Inicial",
    description: "Processos não são formalizados. Sucesso depende de esforços individuais.",
    characteristics: [
      "Processos caóticos e não documentados",
      "Falta de padrões e procedimentos",
      "Resultados imprevisíveis",
      "Dependência de indivíduos",
    ],
  },
  2: {
    name: "Repetível",
    description: "Processos básicos são estabelecidos. Alguns processos são repetíveis.",
    characteristics: [
      "Processos básicos documentados",
      "Alguma padronização",
      "Resultados parcialmente previsíveis",
      "Disciplina básica",
    ],
  },
  3: {
    name: "Definido",
    description: "Processos são padronizados e documentados. Proatividade aumenta.",
    characteristics: [
      "Processos padronizados e documentados",
      "Comunicação clara",
      "Gerenciamento proativo",
      "Conformidade com padrões",
    ],
  },
  4: {
    name: "Gerenciado",
    description: "Processos são medidos e controlados. Resultados previsíveis.",
    characteristics: [
      "Processos medidos e monitorados",
      "Métricas de desempenho",
      "Controle quantitativo",
      "Resultados previsíveis",
    ],
  },
  5: {
    name: "Otimizado",
    description: "Processos são continuamente melhorados. Foco em inovação.",
    characteristics: [
      "Melhoria contínua",
      "Inovação e otimização",
      "Adaptação rápida",
      "Excelência operacional",
    ],
  },
};

/**
 * Calculate gaps between current and target maturity levels
 */
export function calculateMaturityGaps(
  currentLevels: Record<string, number>,
  targetLevel: number = 5
): Record<string, { current: number; target: number; gap: number }> {
  const gaps: Record<string, { current: number; target: number; gap: number }> =
    {};

  for (const [domain, current] of Object.entries(currentLevels)) {
    gaps[domain] = {
      current,
      target: targetLevel,
      gap: Math.max(0, targetLevel - current),
    };
  }

  return gaps;
}

/**
 * Get recommendations based on maturity level
 */
export function getMaturityRecommendations(level: number): string[] {
  const recommendations: Record<number, string[]> = {
    1: [
      "Estabelecer processos básicos e documentação",
      "Definir responsabilidades e papéis",
      "Criar procedimentos padrão",
      "Implementar controles básicos",
    ],
    2: [
      "Padronizar processos existentes",
      "Implementar treinamento",
      "Estabelecer métricas básicas",
      "Melhorar documentação",
    ],
    3: [
      "Implementar automação de processos",
      "Estabelecer governança formal",
      "Criar dashboards de monitoramento",
      "Melhorar conformidade",
    ],
    4: [
      "Implementar análise preditiva",
      "Otimizar recursos",
      "Implementar feedback loops",
      "Melhorar eficiência",
    ],
    5: [
      "Buscar inovação contínua",
      "Implementar IA/ML",
      "Otimizar para o futuro",
      "Ser referência na indústria",
    ],
  };

  return recommendations[level] || [];
}
