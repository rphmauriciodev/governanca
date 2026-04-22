import { invokeLLM } from './_core/llm';
import { storagePut } from './storage';
import {
  getAssessmentResult,
  getAssessmentById,
  getCompanyById,
  getAllCategories,
} from './db';
import { getMaturityLevelDescription, getRecommendations } from './scoreCalculator';

export interface PDFGenerationInput {
  assessmentId: number;
  companyId: number;
}

export async function generateAssessmentPDF(input: PDFGenerationInput): Promise<{
  url: string;
  fileName: string;
  llmAnalysis: string;
  htmlContent: string;
}> {
  const assessment = await getAssessmentById(input.assessmentId);
  const result = await getAssessmentResult(input.assessmentId);
  const company = await getCompanyById(input.companyId);
  const categories = await getAllCategories();

  if (!assessment || !result || !company) {
    throw new Error("Dados da avaliação não encontrados");
  }

  // Build category name map
  const categoryNameMap: Record<number, string> = {};
  categories.forEach((cat) => {
    categoryNameMap[cat.id] = cat.name;
  });

  // Parse scores if they are strings
  const categoryScores: Record<number, number> =
    typeof result.categoryScores === "string"
      ? JSON.parse(result.categoryScores)
      : (result.categoryScores as Record<number, number>);

  const categoryMaturityLevels: Record<number, number> =
    typeof result.categoryMaturityLevels === "string"
      ? JSON.parse(result.categoryMaturityLevels)
      : (result.categoryMaturityLevels as Record<number, number>);

  const overallScore =
    typeof result.overallScore === "string"
      ? parseFloat(result.overallScore)
      : (result.overallScore as unknown as number);

  const overallMaturityLevel =
    typeof result.overallMaturityLevel === "string"
      ? parseInt(result.overallMaturityLevel as any)
      : result.overallMaturityLevel;

  // Generate LLM analysis
  const llmAnalysis = await generateLLMAnalysis({
    companyName: company.name || "",
    industry: company.industry || undefined,
    overallScore,
    overallMaturityLevel,
    categoryScores,
    categoryMaturityLevels,
    categoryNameMap,
  });

  // Generate HTML report content
  const htmlContent = generateReportHTML({
    assessment,
    company,
    overallScore,
    overallMaturityLevel,
    categoryScores,
    categoryMaturityLevels,
    categoryNameMap,
    llmAnalysis,
  });

  const fileName = `relatorio-avaliacao-${input.assessmentId}-${Date.now()}.html`;

  // Retorna o conteúdo HTML diretamente para o frontend lidar com o download
  return {
    url: "", // Não precisamos mais de URL externa
    fileName,
    llmAnalysis,
    htmlContent, // Novo campo com o conteúdo do relatório
  };
}

async function generateLLMAnalysis(data: {
  companyName: string;
  industry?: string;
  overallScore: number;
  overallMaturityLevel: number;
  categoryScores: Record<number, number>;
  categoryMaturityLevels: Record<number, number>;
  categoryNameMap: Record<number, string>;
}): Promise<string> {
  const categoryLines = Object.entries(data.categoryMaturityLevels)
    .map(([catId, level]) => {
      const numCatId = parseInt(catId);
      const numLevel = typeof level === "string" ? parseInt(level as any) : (level as number);
      const score = data.categoryScores[numCatId] || 0;
      const name = data.categoryNameMap[numCatId] || `Categoria ${catId}`;
      return `- ${name}: Score ${score}/5.0 (Nível ${numLevel}: ${getMaturityLevelDescription(numLevel).split(" - ")[0]})`;
    })
    .join("\n");

  const prompt = `
Você é um especialista em governança e maturidade de TI. Analise os seguintes resultados de avaliação de maturidade de TI para a empresa "${data.companyName}" (Setor: ${data.industry || "Não especificado"}).

Score Geral: ${data.overallScore}/5.0 (Nível ${data.overallMaturityLevel}: ${getMaturityLevelDescription(data.overallMaturityLevel)})

Scores por Categoria:
${categoryLines}

Por favor, forneça:
1. Uma análise executiva (2-3 parágrafos) sobre a situação atual de maturidade de TI
2. Principais pontos fortes identificados
3. Principais áreas de melhoria prioritárias
4. Recomendações específicas e acionáveis para os próximos 12 meses
5. Estimativa de impacto e benefícios esperados

Mantenha o tom profissional e direto, focando em valor de negócio.
  `;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um consultor experiente em governança e maturidade de TI, especializado em análise de avaliações CMM/CMMI e frameworks de maturidade. Responda sempre em português do Brasil.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === "string" ? content : "";
}

function generateReportHTML(data: {
  assessment: any;
  company: any;
  overallScore: number;
  overallMaturityLevel: number;
  categoryScores: Record<number, number>;
  categoryMaturityLevels: Record<number, number>;
  categoryNameMap: Record<number, string>;
  llmAnalysis: string;
}): string {
  const maturityLevelNames: Record<number, string> = {
    1: "Inicial",
    2: "Repetível",
    3: "Definido",
    4: "Gerenciado",
    5: "Otimizado",
  };

  const maturityLevelColors: Record<number, string> = {
    1: "#ef4444",
    2: "#f97316",
    3: "#eab308",
    4: "#84cc16",
    5: "#22c55e",
  };

  const maturityLevelDescriptions: Record<number, string> = {
    1: "Processos caóticos e não documentados. A TI opera de forma reativa, sem planejamento ou padrões definidos.",
    2: "Processos básicos estabelecidos e repetíveis. Existe alguma documentação, mas ainda há inconsistências.",
    3: "Processos documentados, padronizados e comunicados. A TI é gerenciada de forma proativa.",
    4: "Processos medidos, controlados e monitorados com métricas. A TI entrega resultados previsíveis.",
    5: "Processos continuamente melhorados e otimizados. A TI é um diferencial estratégico para o negócio.",
  };

  const categoryRows = Object.entries(data.categoryMaturityLevels)
    .map(([catId, level]) => {
      const numCatId = parseInt(catId);
      const numLevel = typeof level === "string" ? parseInt(level as any) : (level as number);
      const score = data.categoryScores[numCatId] || 0;
      const name = data.categoryNameMap[numCatId] || `Categoria ${catId}`;
      const barWidth = Math.round((score / 5) * 100);
      return `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="width: ${barWidth}%; height: 100%; background: ${maturityLevelColors[numLevel]}; border-radius: 4px;"></div>
          </div>
          <span style="font-weight: 600; min-width: 40px;">${Number(score).toFixed(1)}/5</span>
        </div>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="background: ${maturityLevelColors[numLevel]}20; color: ${maturityLevelColors[numLevel]}; padding: 2px 10px; border-radius: 12px; font-weight: 600; font-size: 13px;">
          Nível ${numLevel}
        </span>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: ${maturityLevelColors[numLevel]}; font-weight: 500;">${maturityLevelNames[numLevel]}</td>
    </tr>
  `;
    })
    .join("");

  const recommendations = getRecommendations(data.overallMaturityLevel)
    .map((rec) => `<li style="margin-bottom: 8px;">${rec}</li>`)
    .join("");

  const levelColor = maturityLevelColors[data.overallMaturityLevel];
  const scorePercent = Math.round((data.overallScore / 5) * 100);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Maturidade de TI — ${data.company.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #f9fafb; line-height: 1.6; }
    .page { max-width: 900px; margin: 0 auto; background: white; box-shadow: 0 0 40px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: white; padding: 40px 48px; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header p { opacity: 0.85; font-size: 15px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 32px 48px; background: #f0f4ff; border-bottom: 1px solid #e5e7eb; }
    .meta-item { }
    .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
    .meta-value { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px; }
    .content { padding: 40px 48px; }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 20px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; margin-bottom: 20px; }
    .score-card { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #bfdbfe; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px; }
    .score-value { font-size: 72px; font-weight: 800; color: ${levelColor}; line-height: 1; }
    .score-label { color: #6b7280; font-size: 16px; margin-top: 8px; }
    .level-badge { display: inline-block; background: ${levelColor}; color: white; padding: 8px 24px; border-radius: 24px; font-size: 18px; font-weight: 700; margin-top: 16px; }
    .level-desc { color: #4b5563; font-size: 14px; margin-top: 12px; max-width: 500px; margin-left: auto; margin-right: auto; }
    .score-bar-container { background: #e5e7eb; border-radius: 8px; height: 16px; overflow: hidden; margin-top: 20px; }
    .score-bar { height: 100%; background: ${levelColor}; border-radius: 8px; width: ${scorePercent}%; transition: width 0.5s; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a8a; color: white; padding: 12px 12px; text-align: left; font-size: 13px; font-weight: 600; }
    .analysis-box { background: #faf5ff; border: 1px solid #e9d5ff; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 24px; white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #374151; }
    .rec-list { list-style: none; padding: 0; }
    .rec-list li { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin-bottom: 10px; border-radius: 0 8px 8px 0; font-size: 14px; }
    .next-steps { counter-reset: steps; }
    .next-steps li { counter-increment: steps; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .next-steps li::before { content: counter(steps); background: #1e3a8a; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .footer { background: #f3f4f6; border-top: 1px solid #e5e7eb; padding: 24px 48px; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print { body { background: white; } .page { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>Relatório de Avaliação de Maturidade de TI</h1>
      <p>Análise detalhada do grau de maturidade tecnológica com recomendações estratégicas</p>
    </div>

    <!-- Metadata -->
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Empresa</div>
        <div class="meta-value">${data.company.name}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Setor</div>
        <div class="meta-value">${data.company.industry || "Não especificado"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Data do Relatório</div>
        <div class="meta-value">${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Avaliação</div>
        <div class="meta-value">${data.assessment.title}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Porte da Empresa</div>
        <div class="meta-value">${data.company.size ? data.company.size.charAt(0).toUpperCase() + data.company.size.slice(1) : "Não informado"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Localização</div>
        <div class="meta-value">${data.company.location || "Não informado"}</div>
      </div>
    </div>

    <div class="content">
      <!-- Overall Score -->
      <div class="section">
        <h2 class="section-title">Score Geral de Maturidade</h2>
        <div class="score-card">
          <div class="score-value">${data.overallScore.toFixed(2)}</div>
          <div class="score-label">Score na escala de 1.0 a 5.0</div>
          <div class="level-badge">Nível ${data.overallMaturityLevel}: ${maturityLevelNames[data.overallMaturityLevel]}</div>
          <div class="level-desc">${maturityLevelDescriptions[data.overallMaturityLevel]}</div>
          <div class="score-bar-container">
            <div class="score-bar"></div>
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 6px;">${scorePercent}% do nível máximo de maturidade</div>
        </div>
      </div>

      <!-- Category Scores -->
      <div class="section">
        <h2 class="section-title">Scores por Categoria</h2>
        <table>
          <thead>
            <tr>
              <th>Categoria / Dimensão</th>
              <th>Score</th>
              <th>Nível</th>
              <th>Classificação</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      </div>

      <!-- Maturity Levels Reference -->
      <div class="section">
        <h2 class="section-title">Referência dos Níveis de Maturidade</h2>
        <table>
          <thead>
            <tr>
              <th>Nível</th>
              <th>Nome</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5]
              .map(
                (level) => `
            <tr style="${level === data.overallMaturityLevel ? `background: ${maturityLevelColors[level]}15;` : ""}">
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                <span style="background: ${maturityLevelColors[level]}; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">
                  ${level}
                </span>
              </td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: ${maturityLevelColors[level]};">${maturityLevelNames[level]}${level === data.overallMaturityLevel ? " ← Nível Atual" : ""}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">${maturityLevelDescriptions[level]}</td>
            </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- AI Analysis -->
      <div class="section">
        <h2 class="section-title">Análise Contextual (Gerada por IA)</h2>
        <div class="analysis-box">${data.llmAnalysis}</div>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <h2 class="section-title">Recomendações para Evolução</h2>
        <ul class="rec-list">
          ${recommendations}
        </ul>
      </div>

      <!-- Next Steps -->
      <div class="section">
        <h2 class="section-title">Próximos Passos Sugeridos</h2>
        <ol class="next-steps" style="list-style: none; padding: 0;">
          <li><span>Revisar este relatório com a equipe de TI e liderança executiva</span></li>
          <li><span>Priorizar as recomendações conforme impacto no negócio e viabilidade técnica</span></li>
          <li><span>Definir plano de ação com responsáveis, recursos e prazos claros</span></li>
          <li><span>Estabelecer indicadores de progresso (KPIs) para monitoramento</span></li>
          <li><span>Agendar avaliação de acompanhamento em 6 a 12 meses</span></li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Relatório gerado automaticamente pela Plataforma de Avaliação de Maturidade de TI em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      <p style="margin-top: 4px;">Para dúvidas ou esclarecimentos, entre em contato com a equipe de consultoria responsável.</p>
    </div>
  </div>
</body>
</html>`;
}
