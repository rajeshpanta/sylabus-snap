import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } finally {
    // Always clear local state, even if the API call fails —
    // a stuck session is worse than a stale sign-out
    useAppStore.getState().setSelectedSemester(null);
  }
}
