CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`keyHash` varchar(128) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`tier` enum('free','pro','enterprise') NOT NULL DEFAULT 'free',
	`usageCount` int NOT NULL DEFAULT 0,
	`dailyLimit` int NOT NULL DEFAULT 100,
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `api_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`endpoint` varchar(100) NOT NULL,
	`statusCode` int NOT NULL DEFAULT 200,
	`responseTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_usage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `detection_records` MODIFY COLUMN `type` enum('audio','video','camera','microphone','text','screen','image') NOT NULL;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_usage_logs` ADD CONSTRAINT `api_usage_logs_apiKeyId_api_keys_id_fk` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE cascade ON UPDATE no action;