# Checklist Pré-Deploy Vercel

Use esta lista de verificação para garantir que tudo está pronto antes de fazer o deploy na Vercel.

## Preparação do Código

- [ ] Todos os arquivos foram commitados no Git
- [ ] Não há arquivos não rastreados importantes
- [ ] O código foi testado localmente com `pnpm build`
- [ ] Não há erros de TypeScript: `pnpm check`
- [ ] Não há warnings de build

## Configuração do Projeto

- [ ] `.gitignore` foi atualizado com entradas para Vercel
- [ ] `vercel.json` está configurado corretamente
- [ ] `.vercelignore` foi criado
- [ ] `.env.example` foi criado com todas as variáveis necessárias
- [ ] `.env.local` foi criado localmente (não será commitado)

## Banco de Dados

- [ ] Banco de dados foi criado e está acessível
- [ ] Migrations foram executadas localmente: `pnpm db:push`
- [ ] `DATABASE_URL` está configurado corretamente
- [ ] Banco de dados está acessível de fora (firewall configurado)
- [ ] Backup do banco de dados foi realizado

## Variáveis de Ambiente

- [ ] `DATABASE_URL` foi definida
- [ ] `MANUS_CLIENT_ID` foi definida
- [ ] `MANUS_CLIENT_SECRET` foi definida
- [ ] `AWS_REGION` foi definida
- [ ] `AWS_ACCESS_KEY_ID` foi definida
- [ ] `AWS_SECRET_ACCESS_KEY` foi definida
- [ ] `AWS_S3_BUCKET` foi definida
- [ ] `OPENAI_API_KEY` foi definida
- [ ] Outras variáveis específicas foram definidas
- [ ] Nenhuma variável sensível foi commitada

## GitHub

- [ ] Repositório foi criado no GitHub
- [ ] Código foi feito push para o repositório
- [ ] Branch `main` está atualizado
- [ ] Nenhum arquivo sensível foi commitado

## Vercel

- [ ] Conta Vercel foi criada
- [ ] Repositório foi conectado à Vercel
- [ ] Projeto foi criado na Vercel
- [ ] Framework foi detectado como Vite
- [ ] Build command está correto: `pnpm build`
- [ ] Output directory está correto: `dist`
- [ ] Install command está correto: `pnpm install`

## Variáveis de Ambiente na Vercel

- [ ] Todas as variáveis foram adicionadas ao dashboard da Vercel
- [ ] Variáveis foram adicionadas para o ambiente correto (Production/Preview)
- [ ] Nenhuma variável sensível foi deixada em branco

## Testes Finais

- [ ] Build local foi bem-sucedido: `pnpm build`
- [ ] Aplicação foi testada localmente: `pnpm start`
- [ ] Todas as rotas funcionam localmente
- [ ] Banco de dados conecta corretamente
- [ ] APIs externas (AWS S3, OpenAI) funcionam

## Deploy

- [ ] Primeiro deploy foi iniciado
- [ ] Build na Vercel foi bem-sucedido
- [ ] Aplicação está acessível via URL da Vercel
- [ ] Todas as funcionalidades funcionam em produção
- [ ] Não há erros nos logs da Vercel

## Pós-Deploy

- [ ] URL de produção foi testada
- [ ] Domínio customizado foi configurado (se aplicável)
- [ ] SSL/TLS foi ativado
- [ ] Analytics foi ativado na Vercel
- [ ] Monitoring foi configurado
- [ ] Backup automático foi configurado
- [ ] Notificações de erro foram configuradas

## Segurança

- [ ] `.env` não foi commitado
- [ ] Variáveis sensíveis não estão em logs
- [ ] CORS foi configurado corretamente
- [ ] Rate limiting foi implementado
- [ ] Autenticação foi testada
- [ ] Permissões de banco de dados foram revisadas

## Documentação

- [ ] `DEPLOY.md` foi criado e está atualizado
- [ ] `README.md` contém instruções de setup
- [ ] `CHECKLIST.md` foi preenchido
- [ ] Comentários no código foram adicionados onde necessário

## Rollback Plan

- [ ] Você sabe como fazer rollback se algo der errado
- [ ] Backup do banco de dados está disponível
- [ ] Versão anterior está tagueada no Git

---

## Notas Adicionais

Adicione aqui qualquer informação específica do seu projeto:

```
[Espaço para notas]
```

---

**Data do Deploy:** _______________

**Versão:** _______________

**Responsável:** _______________

**Status:** ⬜ Pendente | ✅ Completo | ❌ Com Problemas
