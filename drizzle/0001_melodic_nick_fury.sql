CREATE TABLE `detection_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('audio','video','camera','microphone','text','screen') NOT NULL,
	`fileName` varchar(255),
	`fileUrl` varchar(1024),
	`riskScore` int NOT NULL DEFAULT 0,
	`verdict` enum('safe','suspicious','deepfake') NOT NULL DEFAULT 'safe',
	`analysisReport` text,
	`duration` int,
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detection_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `detection_records` ADD CONSTRAINT `detection_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;