import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const urlObj = new URL(dbUrl || 'mysql://root@localhost/ti_maturity');

const pool = mysql.createPool({
  connectionLimit: 1,
  host: urlObj.hostname,
  port: urlObj.port || 3306,
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.slice(1),
  waitForConnections: true,
  enableKeepAlive: true,
});

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('🌱 Iniciando população do banco de dados...\n');

    // 0. Limpar tabelas existentes (na ordem correta)
    console.log('🧹 Limpando dados antigos...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'assessment_results',
      'assessment_answers',
      'assessments',
      'questions',
      'categories',
      'companies',
      'users',
      'notifications',
      'pdf_reports',
      'action_plans',
      'access_logs',
      'assessment_history'
    ];
    for (const table of tables) {
      await connection.execute(`TRUNCATE TABLE ${table}`);
    }
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  ✓ Banco de dados limpo');

    // 0.1 Criar usuário administrador
    console.log('\n👤 Criando usuário administrador...');
    const [userResult] = await connection.execute(
      'INSERT INTO users (openId, name, email, role, loginMethod, passwordHash) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin-seed-id', 'Administrador do Sistema', 'admin@ti.local', 'admin', 'local', 'admin123']
    );
    const adminUserId = userResult.insertId;
    console.log(`  ✓ Administrador criado (ID: ${adminUserId})`);

    // 1. Criar categorias de TI
    console.log('📁 Criando categorias de TI...');
    const categories = [
      { name: 'Governança de TI', description: 'Políticas e processos de governança' },
      { name: 'Infraestrutura', description: 'Servidores, redes e data centers' },
      { name: 'Segurança da Informação', description: 'Proteção de dados e compliance' },
      { name: 'Gestão de Projetos', description: 'Planejamento e execução de projetos' },
      { name: 'Gestão de Mudanças', description: 'Controle e implementação de mudanças' },
    ];

    const categoryIds = [];
    for (const cat of categories) {
      const [result] = await connection.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [cat.name, cat.description]
      );
      categoryIds.push(result.insertId);
      console.log(`  ✓ ${cat.name}`);
    }

    // 2. Criar questões
    console.log('\n❓ Criando questões de avaliação...');
    const questions = [
      { categoryId: categoryIds[0], text: 'Existe uma política de governança de TI documentada?', weight: 8 },
      { categoryId: categoryIds[0], text: 'A governança de TI está alinhada com objetivos de negócio?', weight: 9 },
      { categoryId: categoryIds[0], text: 'Existe comitê de governança de TI?', weight: 7 },
      
      { categoryId: categoryIds[1], text: 'Todos os servidores são monitorados em tempo real?', weight: 8 },
      { categoryId: categoryIds[1], text: 'Existe plano de backup e disaster recovery?', weight: 10 },
      { categoryId: categoryIds[1], text: 'A infraestrutura é escalável para crescimento?', weight: 7 },
      
      { categoryId: categoryIds[2], text: 'Existe política de segurança da informação?', weight: 10 },
      { categoryId: categoryIds[2], text: 'Todos os dados sensíveis são criptografados?', weight: 9 },
      { categoryId: categoryIds[2], text: 'Existe programa de treinamento de segurança?', weight: 8 },
      
      { categoryId: categoryIds[3], text: 'Existe metodologia de gestão de projetos?', weight: 8 },
      { categoryId: categoryIds[3], text: 'Projetos são monitorados com métricas?', weight: 7 },
      { categoryId: categoryIds[3], text: 'Existe gestão de riscos em projetos?', weight: 8 },
      
      { categoryId: categoryIds[4], text: 'Existe processo formal de gestão de mudanças?', weight: 9 },
      { categoryId: categoryIds[4], text: 'Mudanças são testadas antes da produção?', weight: 9 },
      { categoryId: categoryIds[4], text: 'Existe plano de rollback para mudanças?', weight: 8 },
    ];

    const questionIds = [];
    for (const q of questions) {
      const [result] = await connection.execute(
        'INSERT INTO questions (categoryId, text, weight) VALUES (?, ?, ?)',
        [q.categoryId, q.text, q.weight]
      );
      questionIds.push(result.insertId);
    }
    console.log(`  ✓ ${questions.length} questões criadas`);

    // 3. Criar empresas fictícias
    console.log('\n🏢 Criando empresas fictícias...');
    const companies = [
      { name: 'TechCorp Brasil', industry: 'Tecnologia', size: 'grande' },
      { name: 'FinanceFlow', industry: 'Financeiro', size: 'media' },
      { name: 'RetailMax', industry: 'Varejo', size: 'grande' },
      { name: 'HealthCare Plus', industry: 'Saúde', size: 'media' },
      { name: 'EnergiaSmart', industry: 'Energia', size: 'media' },
    ];

    const companyIds = [];
    for (const comp of companies) {
      const [result] = await connection.execute(
        'INSERT INTO companies (name, industry, size) VALUES (?, ?, ?)',
        [comp.name, comp.industry, comp.size || 'media']
      );
      companyIds.push(result.insertId);
      console.log(`  ✓ ${comp.name}`);
    }

    // 4. Criar avaliacoes ficticias
    console.log('\n📋 Criando avaliacoes ficticias...');
    const assessments = [];
    for (let i = 0; i < companyIds.length; i++) {
      const [result] = await connection.execute(
        'INSERT INTO assessments (companyId, title, status, assignedByUserId, assignedToUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          companyIds[i],
          `Avaliacao de Maturidade - ${companies[i].name}`,
          i === 0 ? 'completed' : 'in_progress',
          adminUserId,
          adminUserId,
          new Date(),
        ]
      );
      assessments.push({ id: result.insertId, companyId: companyIds[i], index: i });
    }
    console.log(`  ✓ ${assessments.length} avaliações criadas`);

    // 5. Adicionar respostas para avaliação completa
    console.log('\n💬 Adicionando respostas de avaliação...');
    const completedAssessment = assessments[0];
    const scores = [4, 3, 5, 4, 3, 4, 5, 4, 3, 4, 3, 4, 5, 4, 3];
    
    for (let i = 0; i < questionIds.length; i++) {
      await connection.execute(
        'INSERT INTO assessment_answers (assessmentId, questionId, score) VALUES (?, ?, ?)',
        [completedAssessment.id, questionIds[i], scores[i]]
      );
    }
    console.log(`  ✓ ${questionIds.length} respostas adicionadas`);

    // 6. Calcular e salvar resultado da avaliação
    console.log('\n📊 Calculando scores de maturidade...');
    const categoryScores = {};
    const categoryMaturityLevels = {};
    
    for (let catIdx = 0; catIdx < categoryIds.length; catIdx++) {
      const catQuestions = questions.filter(q => q.categoryId === categoryIds[catIdx]);
      let totalScore = 0;
      let totalWeight = 0;
      
      for (const q of catQuestions) {
        const qIdx = questions.indexOf(q);
        totalScore += scores[qIdx] * q.weight;
        totalWeight += q.weight;
      }
      
      const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      const maturityLevel = Math.ceil(avgScore / 5 * 5);
      
      categoryScores[categoryIds[catIdx]] = parseFloat((avgScore / 5 * 5).toFixed(2));
      categoryMaturityLevels[categoryIds[catIdx]] = maturityLevel;
    }

    const overallScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length;
    const overallMaturityLevel = Math.ceil(overallScore / 5 * 5);

    await connection.execute(
      'INSERT INTO assessment_results (assessmentId, categoryScores, categoryMaturityLevels, overallScore, overallMaturityLevel) VALUES (?, ?, ?, ?, ?)',
      [
        completedAssessment.id,
        JSON.stringify(categoryScores),
        JSON.stringify(categoryMaturityLevels),
        parseFloat(overallScore.toFixed(2)),
        overallMaturityLevel,
      ]
    );
    console.log(`  ✓ Score geral: ${overallScore.toFixed(2)}/5.0 (Nível ${overallMaturityLevel})`);

    console.log('\n✅ Banco de dados populado com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`  • ${categoryIds.length} categorias criadas`);
    console.log(`  • ${questionIds.length} questões criadas`);
    console.log(`  • ${companyIds.length} empresas criadas`);
    console.log(`  • ${assessments.length} avaliações criadas`);
    console.log(`  • 1 avaliação completa com scores calculados\n`);

  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDatabase();
