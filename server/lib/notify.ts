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
  const { error } = await supabaseService.from('notifications').insert({
    user_id: p.userId,
    type: p.type,
    title: p.title,
    body: p.body ?? null,
    entity_type: p.entityType ?? null,
    entity_id: p.entityId ?? null,
    meta: p.meta ?? null,
  });
  if (error) throw error;
}