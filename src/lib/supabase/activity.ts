import { createSupabaseBrowserClient } from './client';

/**
 * Log a user activity to the `user_activities` table.
 *
 * Non‑blocking utility: catches errors without breaking UI execution.
 * Automatically fetches the active user ID if not explicitly passed.
 */
export async function logActivity({
  userId,
  featureType,
  title,
  promptPayload,
  resultPayload,
}: {
  userId?: string;
  featureType: 'notes' | 'answer_assistant' | 'answer_checker';
  title: string;
  promptPayload: unknown;
  resultPayload: unknown;
}) {
  try {
    const supabase = createSupabaseBrowserClient();

    let targetUserId = userId;
    if (!targetUserId) {
      const { data } = await supabase.auth.getUser();
      targetUserId = data.user?.id;
    }

    if (!targetUserId) {
      console.warn('Activity logging skipped: User is not authenticated.');
      return;
    }

    const { error } = await supabase.from('user_activities').insert({
      user_id: targetUserId,
      feature_type: featureType,
      title,
      prompt_payload: promptPayload,
      result_payload: resultPayload,
    });

    if (error) {
      console.error('Failed to log activity:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
  } catch (e) {
    console.error('Unexpected error while logging activity:', e);
  }
}