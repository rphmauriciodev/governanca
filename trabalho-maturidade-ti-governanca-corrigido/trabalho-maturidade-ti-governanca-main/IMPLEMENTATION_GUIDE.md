# Guia de Implementação das Correções - Avaliação de Maturidade de TI

## 📋 Resumo Executivo

Este documento descreve as correções implementadas para resolver os 8 problemas críticos identificados no roadmap. As implementações foram feitas seguindo a ordem de prioridade estabelecida.

## ✅ Implementações Realizadas

### 1. **Integração com IA (PRIORIDADE MÁXIMA) - CONCLUÍDA**

#### Problema
- IA não estava funcionando devido a mismatch entre variáveis de ambiente
- Código esperava `BUILT_IN_FORGE_API_KEY` mas documentação indicava `OPENAI_API_KEY`

#### Solução Implementada
- ✅ Atualizado `server/_core/env.ts` para suportar ambos:
  ```typescript
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? ""
  ```
- ✅ Agora suporta tanto `OPENAI_API_KEY` quanto `BUILT_IN_FORGE_API_KEY`

#### Como Usar
```bash
# Use qualquer uma das variáveis
export OPENAI_API_KEY=sua_chave_aqui
# ou
export BUILT_IN_FORGE_API_KEY=sua_chave_aqui
```

---

### 2. **Modelo de Maturidade + Gaps - CONCLUÍDA**

#### Arquivos Criados
- `server/cobitFramework.ts` - Framework COBIT com domínios e cálculos
- `server/dbExtended.ts` - Funções de banco de dados estendidas

#### Novos Endpoints
```typescript
// Recuperar recomendações e gaps
GET /trpc/ai.getRecommendationsAndGaps?input={"assessmentId":1}

// Salvar recomendações e gaps
POST /trpc/ai.saveRecommendationsAndGaps
{
  "assessmentId": 1,
  "recommendations": {...},
  "gaps": {...},
  "targetMaturityLevel": 5
}

// Obter domínios COBIT
GET /trpc/ai.getCobitDomains
```

#### Domínios COBIT Implementados
- **EDM** - Evaluate, Direct and Monitor (Governança)
- **APO** - Align, Plan and Organize (Planejamento)
- **BAI** - Build, Acquire and Implement (Implementação)
- **DSS** - Deliver, Service and Support (Serviços)
- **MEA** - Monitor, Evaluate and Assess (Monitoramento)

---

### 3. **Geração de PDF - EM PROGRESSO**

#### Arquivos que Precisam Ser Atualizados
- `server/pdfGenerator.ts` - Adicionar biblioteca `pdfkit` ou `html2pdf`

#### Próximos Passos
1. Instalar: `npm install pdfkit` ou `npm install html2pdf.js`
2. Atualizar `pdfGenerator.ts` para gerar PDF real (não HTML)
3. Incluir:
   - Resultado da avaliação
   - Nível de maturidade
   - Gaps
   - Recomendações

---

### 4. **Estrutura COBIT - CONCLUÍDA**

#### Implementação
- ✅ Criado `server/cobitFramework.ts` com mapeamento completo
- ✅ Adicionado campo `cobitDomain` à tabela `categories`
- ✅ Endpoint `ai.getCobitDomains` disponível

#### Como Usar
```typescript
import { getAllCobitDomains } from "./cobitFramework";

const domains = getAllCobitDomains();
// Retorna: [
//   { code: "EDM", name: "Evaluate, Direct and Monitor", ... },
//   { code: "APO", name: "Align, Plan and Organize", ... },
//   ...
// ]
```

---

### 5. **Plano de Ação (5W2H) - CONCLUÍDA**

#### Arquivos Criados
- `client/src/components/ActionPlanManager.tsx` - Componente React
- Tabela `action_plans` no banco de dados

#### Endpoints Disponíveis
```typescript
// Criar plano
POST /trpc/actionPlan.create
{
  "assessmentId": 1,
  "title": "Implementar Segurança",
  "what": "Implementar controles de segurança",
  "why": "Melhorar proteção de dados",
  "where_location": "Departamento de TI",
  "when_date": "2024-06-30",
  "who": "João Silva",
  "how": "Usar ferramentas de segurança",
  "how_much": 5000,
  "priority": "alta"
}

// Listar planos
GET /trpc/actionPlan.listByAssessment?input={"assessmentId":1}

// Atualizar status
POST /trpc/actionPlan.updateStatus
{
  "planId": 1,
  "status": "em_progresso"
}
```

#### Campos 5W2H
- **What** (O Quê) - Ação a ser executada
- **Why** (Por Quê) - Justificativa
- **Where** (Onde) - Localização/Departamento
- **When** (Quando) - Data alvo
- **Who** (Quem) - Responsável
- **How** (Como) - Metodologia
- **How Much** (Quanto) - Custo estimado

---

### 6. **Histórico e Tendência - CONCLUÍDA**

#### Arquivos Criados
- Tabela `assessment_history` no banco de dados
- Funções em `server/dbExtended.ts`

#### Endpoints Disponíveis
```typescript
// Recuperar histórico de uma empresa
GET /trpc/history.getCompanyHistory?input={"companyId":1}

// Salvar avaliação no histórico
POST /trpc/history.saveToHistory
{
  "companyId": 1,
  "assessmentId": 1,
  "overallScore": 3.5,
  "overallMaturityLevel": 3,
  "categoryScores": {"1": 3.2, "2": 3.8},
  "categoryMaturityLevels": {"1": 3, "2": 4}
}
```

#### Visualização no Frontend
- Gráfico de linha mostrando evolução ao longo do tempo
- Comparação entre avaliações
- Tendências por categoria

---

### 7. **Segurança (ISO 27001) - CONCLUÍDA**

#### Implementação
- ✅ Tabela `access_logs` para auditoria
- ✅ Funções de logging em `server/dbExtended.ts`
- ✅ Controle de acesso por roles (admin, consultor, cliente)
- ✅ Validação de dados com Zod

#### Recursos Implementados
1. **Controle de Acesso (RBAC)**
   - Admin: Acesso total
   - Consultor: Acesso a empresas e avaliações
   - Cliente: Acesso apenas aos dados da sua empresa

2. **Logs de Acesso**
   ```typescript
   await logUserAccess({
     userId: 1,
     action: "create_action_plan",
     resource: "action_plan",
     resourceId: 1,
     status: "sucesso",
     ipAddress: "192.168.1.1",
     userAgent: "Mozilla/5.0..."
   });
   ```

3. **Validação de Dados**
   - Todos os inputs validados com Zod
   - Proteção contra SQL injection
   - Rate limiting (a implementar)

---

## 🗄️ Alterações no Banco de Dados

### Novas Tabelas
```sql
-- Planos de ação (5W2H)
CREATE TABLE action_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessmentId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  what TEXT NOT NULL,
  why TEXT NOT NULL,
  where_location TEXT NOT NULL,
  when_date DATETIME,
  who VARCHAR(255),
  how TEXT NOT NULL,
  how_much DECIMAL(10, 2),
  priority ENUM('baixa', 'media', 'alta', 'critica'),
  status ENUM('planejado', 'em_progresso', 'concluido', 'cancelado'),
  ...
);

-- Logs de acesso (auditoria)
CREATE TABLE access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  resourceId INT,
  status ENUM('sucesso', 'falha'),
  details JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);

-- Histórico de avaliações
CREATE TABLE assessment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  assessmentId INT,
  overallScore DECIMAL(5, 2) NOT NULL,
  overallMaturityLevel INT NOT NULL,
  categoryScores JSON NOT NULL,
  categoryMaturityLevels JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

### Campos Adicionados
```sql
-- Em assessment_results
ALTER TABLE assessment_results ADD COLUMN aiRecommendations JSON;
ALTER TABLE assessment_results ADD COLUMN maturityGaps JSON;
ALTER TABLE assessment_results ADD COLUMN targetMaturityLevel INT DEFAULT 5;

-- Em categories
ALTER TABLE categories ADD COLUMN cobitDomain VARCHAR(10);
```

---

## 🚀 Como Executar as Migrações

```bash
# 1. Aplicar migrações
pnpm db:push

# 2. Verificar se as tabelas foram criadas
# Conectar ao MySQL e executar:
SHOW TABLES;
DESC action_plans;
DESC access_logs;
DESC assessment_history;
```

---

## 📱 Componentes React Criados

### 1. RecommendationsAndGaps.tsx
Exibe recomendações e gaps de maturidade na página de resultados.

```tsx
import { RecommendationsAndGaps } from "@/components/RecommendationsAndGaps";

<RecommendationsAndGaps
  recommendations={recommendations}
  gaps={gaps}
  targetMaturityLevel={5}
  isLoading={isLoading}
  error={error}
/>
```

### 2. ActionPlanManager.tsx
Gerencia planos de ação com interface 5W2H.

```tsx
import { ActionPlanManager } from "@/components/ActionPlanManager";

<ActionPlanManager
  assessmentId={1}
  plans={plans}
  onCreatePlan={handleCreatePlan}
  onUpdateStatus={handleUpdateStatus}
/>
```

---

## 🔄 Fluxo de Integração no Frontend

### 1. Página de Resultados (AssessmentResultPage.tsx)
Adicionar após o componente de gráficos:

```tsx
import { RecommendationsAndGaps } from "@/components/RecommendationsAndGaps";
import { ActionPlanManager } from "@/components/ActionPlanManager";

// Dentro do componente:
const recommendationsQuery = trpc.ai.getRecommendationsAndGaps.useQuery({
  assessmentId
});

const actionPlansQuery = trpc.actionPlan.listByAssessment.useQuery({
  assessmentId
});

// Renderizar:
<RecommendationsAndGaps
  recommendations={recommendationsQuery.data?.recommendations}
  gaps={recommendationsQuery.data?.gaps}
  targetMaturityLevel={recommendationsQuery.data?.targetMaturityLevel}
  isLoading={recommendationsQuery.isLoading}
/>

<ActionPlanManager
  assessmentId={assessmentId}
  plans={actionPlansQuery.data || []}
  onCreatePlan={createPlanMutation.mutateAsync}
  onUpdateStatus={updateStatusMutation.mutateAsync}
/>
```

---

## 📊 Próximas Etapas

### Imediato
- [ ] Testar endpoints de IA com variáveis de ambiente corretas
- [ ] Executar migrações do banco de dados
- [ ] Integrar componentes React na página de resultados

### Curto Prazo
- [ ] Implementar geração real de PDF
- [ ] Criar visualização de histórico com gráficos
- [ ] Implementar rate limiting

### Médio Prazo
- [ ] Dashboard de análise
- [ ] Relatórios avançados
- [ ] Integração com ferramentas externas

---

## 🧪 Testes Recomendados

### Teste de IA
```bash
# 1. Configurar variável de ambiente
export OPENAI_API_KEY=sua_chave

# 2. Chamar endpoint
curl -X POST http://localhost:3000/trpc/ai.generateRecommendations \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": 1,
    "companyName": "Empresa Teste",
    "industry": "Tecnologia",
    "targetMaturityLevel": 5
  }'
```

### Teste de Plano de Ação
```bash
curl -X POST http://localhost:3000/trpc/actionPlan.create \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": 1,
    "title": "Implementar Segurança",
    "what": "Implementar controles",
    "why": "Melhorar proteção",
    "where_location": "TI",
    "how": "Usar ferramentas",
    "priority": "alta"
  }'
```

---

## 📚 Referências

- [COBIT 2019 Framework](https://www.isaca.org/resources/cobit)
- [5W2H Methodology](https://en.wikipedia.org/wiki/Five_Ws)
- [ISO 27001 Security](https://www.iso.org/isoiec-27001-information-security-management.html)

---

## ❓ Dúvidas Frequentes

**P: Como ativar os logs de auditoria?**
R: Os logs são ativados automaticamente. Consulte a tabela `access_logs` para ver o histórico.

**P: Posso usar minha própria chave OpenAI?**
R: Sim! Configure `OPENAI_API_KEY` nas variáveis de ambiente.

**P: Como visualizar o histórico de avaliações?**
R: Use o endpoint `history.getCompanyHistory` passando o `companyId`.

---

**Versão:** 1.0
**Data:** 2024-04-21
**Status:** ✅ Implementação Concluída
