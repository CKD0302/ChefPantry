import { supabaseService } from "./supabaseService";

type NotifyParams = {
  userId: string;
  type: 'invoice_submitted' | 'invoice_paid';
  title: string;
  body?: string;
  entityType?: 'invoice';
  entityId?: string;
  meta?: Record<string, any>;
};

export async function createNotification(p: NotifyParams) {
  try {
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