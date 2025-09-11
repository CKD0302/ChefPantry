import { z } from "zod";

/**
 * Validation schema for notification ID parameter
 */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Notification ID must be a valid UUID")
});

/**
 * Validation schema for notification query parameters
 */
export const notificationQuerySchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID").optional()
});

/**
 * Type definitions for validated notification request data
 */
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;