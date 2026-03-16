ALTER TABLE `detection_records` ADD `userFeedback` enum('correct','incorrect','unsure');--> statement-breakpoint
ALTER TABLE `detection_records` ADD `feedbackLabel` enum('ai_generated','real','deepfake_video','ai_audio','human_audio');--> statement-breakpoint
ALTER TABLE `detection_records` ADD `feedbackNote` text;--> statement-breakpoint
ALTER TABLE `detection_records` ADD `feedbackAt` timestamp;