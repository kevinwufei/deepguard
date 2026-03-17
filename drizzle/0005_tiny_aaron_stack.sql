CREATE TABLE `usage_quotas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprint` varchar(128),
	`userId` int,
	`date` varchar(10) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_quotas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `usage_quotas` ADD CONSTRAINT `usage_quotas_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;