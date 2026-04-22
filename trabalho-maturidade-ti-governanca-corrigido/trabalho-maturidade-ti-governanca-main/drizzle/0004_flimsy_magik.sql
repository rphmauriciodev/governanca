CREATE TABLE `access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resource` varchar(255),
	`resourceId` int,
	`status` enum('sucesso','falha') NOT NULL DEFAULT 'sucesso',
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `action_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`what` text NOT NULL,
	`why` text NOT NULL,
	`where_location` text NOT NULL,
	`when_date` timestamp,
	`who` varchar(255),
	`how` text NOT NULL,
	`how_much` decimal(10,2),
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`status` enum('planejado','em_progresso','concluido','cancelado') NOT NULL DEFAULT 'planejado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `action_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`assessmentId` int,
	`overallScore` decimal(5,2) NOT NULL,
	`overallMaturityLevel` int NOT NULL,
	`categoryScores` json NOT NULL,
	`categoryMaturityLevels` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `access_logs` ADD CONSTRAINT `accessLogs_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `action_plans` ADD CONSTRAINT `actionPlans_assessmentId_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_history` ADD CONSTRAINT `assessmentHistory_companyId_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_history` ADD CONSTRAINT `assessmentHistory_assessmentId_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE set null ON UPDATE no action;