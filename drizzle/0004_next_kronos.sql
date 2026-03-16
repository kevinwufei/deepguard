CREATE TABLE `shared_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(32) NOT NULL,
	`userId` int,
	`detectionRecordId` int,
	`type` enum('audio','video','camera','microphone','text','screen','image') NOT NULL,
	`fileName` varchar(255),
	`fileUrl` varchar(1024),
	`riskScore` int NOT NULL DEFAULT 0,
	`verdict` enum('safe','suspicious','deepfake') NOT NULL DEFAULT 'safe',
	`analysisReport` text,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `shared_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_reports_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `shared_reports` ADD CONSTRAINT `shared_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shared_reports` ADD CONSTRAINT `shared_reports_detectionRecordId_detection_records_id_fk` FOREIGN KEY (`detectionRecordId`) REFERENCES `detection_records`(`id`) ON DELETE set null ON UPDATE no action;