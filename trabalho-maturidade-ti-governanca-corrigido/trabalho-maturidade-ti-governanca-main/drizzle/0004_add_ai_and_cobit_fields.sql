-- Add COBIT domain field to categories
ALTER TABLE categories ADD COLUMN cobitDomain VARCHAR(10) DEFAULT NULL;

-- Add AI recommendations and gaps to assessment_results
ALTER TABLE assessment_results ADD COLUMN aiRecommendations JSON DEFAULT NULL;
ALTER TABLE assessment_results ADD COLUMN maturityGaps JSON DEFAULT NULL;
ALTER TABLE assessment_results ADD COLUMN targetMaturityLevel INT DEFAULT 5;

-- Create action_plans table for 5W2H
CREATE TABLE IF NOT EXISTS action_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessmentId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  what TEXT NOT NULL,
  why TEXT NOT NULL,
  where_location TEXT NOT NULL,
  when_date DATETIME,
  who VARCHAR(255),
  how TEXT NOT NULL,
  how_much DECIMAL(10, 2),
  priority ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
  status ENUM('planejado', 'em_progresso', 'concluido', 'cancelado') DEFAULT 'planejado',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assessmentId) REFERENCES assessments(id) ON DELETE CASCADE
);

-- Create access_logs table for security/audit
CREATE TABLE IF NOT EXISTS access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  resourceId INT,
  status ENUM('sucesso', 'falha') DEFAULT 'sucesso',
  details JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, createdAt),
  INDEX (action, createdAt)
);

-- Create assessment_history table for tracking evolution
CREATE TABLE IF NOT EXISTS assessment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  assessmentId INT,
  overallScore DECIMAL(5, 2) NOT NULL,
  overallMaturityLevel INT NOT NULL,
  categoryScores JSON NOT NULL,
  categoryMaturityLevels JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (assessmentId) REFERENCES assessments(id) ON DELETE SET NULL,
  INDEX (companyId, createdAt)
);
