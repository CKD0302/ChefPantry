import { Resend } from "resend";
import { logger } from "./logger";
import { storage } from "../storage";

// Validate required environment variables at startup
if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing required environment variable: RESEND_API_KEY');
}

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.EMAIL_FROM || "Chef Pantry <no-reply@thechefpantry.co>";

// Map notification types to email preference field names
const notificationTypeToEmailPreferenceKey: Record<string, string> = {
  'chef_applied': 'chefAppliedEmail',
  'application_accepted': 'applicationAcceptedEmail',
  'application_rejected': 'applicationRejectedEmail',
  'gig_confirmed': 'gigConfirmedEmail',
  'gig_declined': 'gigDeclinedEmail',
  'invoice_submitted': 'invoiceSubmittedEmail',
  'invoice_paid': 'invoicePaidEmail',
  'review_reminder': 'reviewReminderEmail',
  'review_submitted': 'reviewSubmittedEmail',
  'gig_posted': 'gigPostedEmail',
  'gig_updated': 'gigUpdatedEmail',
  'gig_cancelled': 'gigCancelledEmail',
  'gig_deadline': 'gigDeadlineEmail',
  'profile_update': 'profileUpdateEmail',
  'welcome': 'welcomeEmail',
  'platform_update': 'platformUpdateEmail'
};

// Function to get user notification preferences
async function getUserNotificationPreferences(userId: string) {
  try {
    const preferences = await storage.getNotificationPreferences(userId);
    return preferences;
  } catch (error) {
    console.error('Failed to get notification preferences for user', userId, ':', error);
    // Return null so we can fall back to sending emails if preferences can't be loaded
    return null;
  }
}

// Enhanced sendEmail function that respects user preferences
export async function sendEmailWithPreferences(userId: string, notificationType: string, to: string | string[], subject: string, html: string) {
  try {
    // Check user preferences before sending email
    const preferences = await getUserNotificationPreferences(userId);
    const preferenceKey = notificationTypeToEmailPreferenceKey[notificationType];
    
    // If we have preferences and this email type is disabled, skip it
    if (preferences && preferenceKey && preferenceKey in preferences) {
      const isEnabled = (preferences as any)[preferenceKey];
      if (isEnabled === false) {
        console.log(`Skipping email notification for user ${userId} (type: ${notificationType}) - disabled in preferences`);
        return;
      }
    }
    
    // If no preferences found or preference is enabled, send the email
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('Failed to send email with preferences:', error);
    throw error;
  }
}

// Original sendEmail function for backwards compatibility and internal use
export async function sendEmail(to: string | string[], subject: string, html: string) {
  try {
    logger.debug(`[email] Sending to: ${Array.isArray(to) ? to.join(', ') : to} | Subject: ${subject}`);
    
    const response = await resend.emails.send({ from: FROM, to, subject, html });
    
    if (response.error) {
      logger.error('[email] ❌ Resend API error:', response.error);
      throw new Error(`Resend API error: ${response.error.message}`);
    }
    
    if (response.data) {
      logger.debug(`[email] ✅ Email accepted by Resend! ID: ${response.data.id}`);
      logger.info(`Email sent to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`);
    } else {
      logger.warn('[email] ⚠️ Unexpected response format from Resend API');
    }
  } catch (error) {
    logger.error('[email] Failed to send email:', error);
    throw error;
  }
}

export function tplInvoiceSubmitted(params: {
  businessName: string; 
  chefName: string; 
  invoiceId: string; 
  amountGBP: number; 
  url: string;
}) {
  const { businessName, chefName, invoiceId, amountGBP, url } = params;
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>New invoice from ${chefName}</h2>
      <p>${chefName} has submitted an invoice.</p>
      <p><strong>Invoice ID:</strong> ${invoiceId}<br/>
         <strong>Amount:</strong> £${amountGBP.toFixed(2)}</p>
      <p><a href="${url}" style="display:inline-block;background:#ff6a2b;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">Review & Pay</a></p>
      <p>— Chef Pantry</p>
    </div>`;
}

export function tplInvoicePaid(params: {
  chefName: string; 
  businessName: string; 
  invoiceId: string; 
  amountGBP: number; 
  url: string;
}) {
  const { chefName, businessName, invoiceId, amountGBP, url } = params;
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Invoice paid</h2>
      <p>${businessName} marked your invoice as <strong>Paid</strong>.</p>
      <p><strong>Invoice ID:</strong> ${invoiceId}<br/>
         <strong>Amount:</strong> £${amountGBP.toFixed(2)}</p>
      <p><a href="${url}" style="display:inline-block;background:#ff6a2b;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">View invoice</a></p>
      <p>— Chef Pantry</p>
    </div>`;
}