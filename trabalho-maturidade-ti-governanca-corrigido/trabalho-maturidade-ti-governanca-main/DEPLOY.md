# Guia de Deploy na Vercel

Este documento fornece instruções passo a passo para fazer o deploy do projeto TI Maturity Assessment na Vercel.

## Pré-requisitos

- Conta no GitHub com o repositório do projeto
- Conta na Vercel (https://vercel.com)
- Node.js 20.x ou superior instalado localmente
- pnpm instalado (`npm install -g pnpm`)

## Preparação Local

### 1. Verificar a Estrutura do Projeto

O projeto está configurado com:
- **Frontend**: Vite + React + TypeScript
- **Backend**: Express + tRPC
- **Banco de Dados**: MySQL/TiDB
- **ORM**: Drizzle

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` baseado em `.env.example`:

```bash
cp .env.example .env.local
```

Preencha as variáveis de ambiente necessárias:

```env
DATABASE_URL=mysql://user:password@host:3306/database_name
MANUS_CLIENT_ID=your_client_id
MANUS_CLIENT_SECRET=your_client_secret
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Testar Localmente

```bash
# Build do projeto
pnpm build

# Iniciar em produção
pnpm start
```

## Deploy na Vercel

### Opção 1: Via Interface Web (Recomendado)

1. **Acesse o Dashboard da Vercel**
   - Vá para https://vercel.com/dashboard
   - Clique em "Add New..." → "Project"

2. **Importar Repositório**
   - Selecione seu repositório do GitHub
   - Clique em "Import"

3. **Configurar Projeto**
   - **Framework Preset**: Vite (será detectado automaticamente)
   - **Build Command**: `pnpm build` (padrão)
   - **Output Directory**: `dist` (padrão)
   - **Install Command**: `pnpm install` (padrão)

4. **Adicionar Variáveis de Ambiente**
   - Vá para "Settings" → "Environment Variables"
   - Adicione todas as variáveis do `.env.example`:
     - `DATABASE_URL`
     - `MANUS_CLIENT_ID`
     - `MANUS_CLIENT_SECRET`
     - `AWS_REGION`
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_S3_BUCKET`
     - `OPENAI_API_KEY`
     - E outras conforme necessário

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde a conclusão do build

### Opção 2: Via CLI (Vercel CLI)

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Fazer Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configurar Variáveis de Ambiente**
   ```bash
   vercel env add DATABASE_URL
   vercel env add MANUS_CLIENT_ID
   # ... adicione todas as variáveis necessárias
   ```

5. **Deploy em Produção**
   ```bash
   vercel --prod
   ```

## Configurações Importantes

### 1. Arquivo `vercel.json`

O projeto inclui um arquivo `vercel.json` com as configurações necessárias:

```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "vite",
  "functions": {
    "server/_core/index.ts": {
      "runtime": "nodejs20.x",
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

### 2. Arquivo `.vercelignore`

Exclui arquivos desnecessários do build para reduzir o tempo de deploy.

### 3. Banco de Dados

Para usar um banco de dados MySQL/TiDB:

1. **Opção A: Usar um serviço externo**
   - Planetscale (MySQL compatível)
   - TiDB Cloud
   - AWS RDS
   - DigitalOcean Managed Databases

2. **Opção B: Configurar Variável de Ambiente**
   - Adicione `DATABASE_URL` nas variáveis de ambiente da Vercel
   - Formato: `mysql://user:password@host:port/database`

### 4. Migrações de Banco de Dados

Se precisar executar migrações após o deploy:

1. **Localmente, antes do push:**
   ```bash
   pnpm db:push
   ```

2. **Ou após o deploy, via CLI:**
   ```bash
   vercel env pull
   pnpm db:push
   ```

## Troubleshooting

### Erro: "Build failed"

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique os logs de build na Vercel
3. Teste localmente com `pnpm build`

### Erro: "Database connection failed"

1. Verifique se `DATABASE_URL` está correto
2. Verifique se o banco de dados está acessível de fora (não bloqueado por firewall)
3. Teste a conexão localmente

### Erro: "API routes not working"

1. Verifique se o `vercel.json` está configurado corretamente
2. Verifique os logs de função na Vercel
3. Teste as rotas localmente com `pnpm start`

### Erro: "Static files not serving"

1. Verifique se o `dist` foi gerado corretamente
2. Verifique se o `public` está incluído no build
3. Limpe o cache: `vercel --prod --force`

## Monitoramento

### Analytics

1. Acesse o dashboard do projeto na Vercel
2. Vá para "Analytics" para ver:
   - Performance
   - Requisições
   - Erros
   - Uso de recursos

### Logs

1. Vá para "Functions" para ver logs de funções serverless
2. Vá para "Deployments" para ver histórico de deploys

## Atualizações Contínuas

### GitHub Integration

1. A Vercel está configurada para fazer deploy automático quando você faz push para `main`
2. Cada pull request terá um preview deployment
3. Merges para `main` disparam um deploy em produção

### Rollback

Se algo der errado:

1. Vá para "Deployments" na Vercel
2. Selecione um deployment anterior
3. Clique em "Promote to Production"

## Variáveis de Ambiente por Ambiente

A Vercel suporta diferentes variáveis para diferentes ambientes:

```bash
# Preview (pull requests)
vercel env add VARIABLE_NAME --environment preview

# Production
vercel env add VARIABLE_NAME --environment production

# Development (local)
vercel env add VARIABLE_NAME --environment development
```

## Segurança

1. **Nunca commite `.env`** - Use `.env.example` como template
2. **Variáveis sensíveis** - Use as variáveis de ambiente da Vercel
3. **Secrets** - Para dados muito sensíveis, considere usar um serviço de secrets
4. **CORS** - Configure CORS adequadamente no seu backend
5. **Rate Limiting** - Implemente rate limiting para APIs

## Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/cli)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Express on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions)

## Suporte

Para problemas específicos:

1. Verifique a documentação da Vercel
2. Consulte os logs de build e runtime
3. Abra uma issue no repositório do projeto
4. Contate o suporte da Vercel

DEPLOY 30032026