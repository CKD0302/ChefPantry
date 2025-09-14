import { supabaseService } from "./supabaseService";
import { storage } from "../storage";

// Updated to include all notification types from the expanded schema
type NotifyParams = {
  userId: string;
  type: 'chef_applied' | 'application_accepted' | 'application_rejected' | 'gig_confirmed' | 'gig_declined' |
        'invoice_submitted' | 'invoice_paid' | 'review_reminder' | 'review_submitted' |
        'gig_posted' | 'gig_updated' | 'gig_cancelled' | 'gig_deadline' |
        'profile_update' | 'welcome' | 'platform_update' |
        'company_invite_received' | 'company_invite_accepted' | 'company_invite_rejected';
  title: string;
  body?: string;
  entityType?: 'invoice' | 'gig' | 'application' | 'review' | 'company_invite';
  entityId?: string;
  meta?: Record<string, any>;
};

// Map notification types to preference field names
const notificationTypeToPreferenceKey: Record<string, string> = {
  'chef_applied': 'chefAppliedApp',
  'application_accepted': 'applicationAcceptedApp',
  'application_rejected': 'applicationRejectedApp',
  'gig_confirmed': 'gigConfirmedApp',
  'gig_declined': 'gigDeclinedApp',
  'invoice_submitted': 'invoiceSubmittedApp',
  'invoice_paid': 'invoicePaidApp',
  'review_reminder': 'reviewReminderApp',
  'review_submitted': 'reviewSubmittedApp',
  'gig_posted': 'gigPostedApp',
  'gig_updated': 'gigUpdatedApp',
  'gig_cancelled': 'gigCancelledApp',
  'gig_deadline': 'gigDeadlineApp',
  'profile_update': 'profileUpdateApp',
  'welcome': 'welcomeApp',
  'platform_update': 'platformUpdateApp',
  'company_invite_received': 'companyInviteReceivedApp',
  'company_invite_accepted': 'companyInviteAcceptedApp',
  'company_invite_rejected': 'companyInviteRejectedApp'
};

// Function to get user notification preferences
async function getUserNotificationPreferences(userId: string) {
  try {
    const preferences = await storage.getNotificationPreferences(userId);
    return preferences;
  } catch (error) {
    console.error('Failed to get notification preferences for user', userId, ':', error);
    // Return null so we can fall back to sending notifications if preferences can't be loaded
    return null;
  }
}

export async function createNotification(p: NotifyParams) {
  try {
    // Check user preferences before creating notification
    const preferences = await getUserNotificationPreferences(p.userId);
    const preferenceKey = notificationTypeToPreferenceKey[p.type];
    
    // If we have preferences and this notification type is disabled, skip it
    if (preferences && preferenceKey && preferenceKey in preferences) {
      const isEnabled = (preferences as any)[preferenceKey];
      if (isEnabled === false) {
        console.log(`Skipping app notification for user ${p.userId} (type: ${p.type}) - disabled in preferences`);
        return;
      }
    }
    
    // If no preferences found or preference is enabled, send the notification
    const { error } = await supabaseService.from('notifications').insert({
      user_id: p.userId,
      type: p.type,
      title: p.title,
      body: p.body ?? null,
      entity_type: p.entityType ?? null,
      entity_id: p.entityId ?? null,
      meta: p.meta ?? null,
    });
    
    if (error) {
      console.error('Supabase notification error:', error);
      return; // Don't throw - just log and continue
    }
    
    console.log(`Notification created successfully for user ${p.userId}: ${p.title}`);
  } catch (error) {
    console.error('Failed to create notification (non-critical):', error);
    // Don't throw - this allows invoice creation to continue even if notifications fail
  }
}