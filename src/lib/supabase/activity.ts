// lib/supabase/activity.ts

/**
 * Log a user activity to the `user_activities` table.
 *
 * This utility is intentionally non‑blocking: any error while inserting
 * a log entry is caught and reported to the console but never propagates
 * to the caller, ensuring that UI code does not fail because of logging.
 */
export async function logActivity({
  userId,
  featureType,
  title,
  promptPayload,
  resultPayload,
}: {
  userId: string;
  featureType: 'notes' | 'answer_assistant' | 'answer_checker';
  title: string;
  promptPayload: unknown;
  resultPayload: unknown;
}) {
  // Lazy import to avoid pulling Supabase client into bundles where it isn’t needed.
  const { createSupabaseBrowserClient } = await import('./client');
  const supabase = createSupabaseBrowserClient();

  try {
    const { error } = await supabase.from('user_activities').insert({
      user_id: userId,
      feature_type: featureType,
      title,
      prompt_payload: promptPayload,
      result_payload: resultPayload,
    });
    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (e) {
    console.error('Unexpected error while logging activity:', e);
  }
}
