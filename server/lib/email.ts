import { Resend } from "resend";
import { logger } from "./logger";

// Validate required environment variables at startup
if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing required environment variable: RESEND_API_KEY');
}

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.EMAIL_FROM || "Chef Pantry <no-reply@thechefpantry.co>";

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