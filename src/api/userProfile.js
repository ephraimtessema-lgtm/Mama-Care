import { supabase } from '@/lib/supabase';
import {
  FLOWER_NAMES,
  mergePreferences,
  loadLocalPreferences,
  saveLocalPreferences,
} from '@/lib/userSettings';

export { FLOWER_NAMES };

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, flower_name, phone, due_date, baby_birth_date, preferences, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  const preferences = mergePreferences(
    data?.preferences && typeof data.preferences === 'object'
      ? data.preferences
      : loadLocalPreferences(userId),
  );

  return {
    ...data,
    preferences,
  };
}

export async function updateUserProfile(userId, patch) {
  const { preferences, ...rest } = patch;
  const payload = { ...rest };
  if (preferences) {
    payload.preferences = preferences;
    saveLocalPreferences(userId, preferences);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id, full_name, flower_name, phone, due_date, baby_birth_date, preferences')
    .single();

  if (error) {
    if (preferences) saveLocalPreferences(userId, preferences);
    if (rest && Object.keys(rest).length) throw error;
    return null;
  }
  return data;
}

export async function updateFlowerName(userId, flowerName) {
  const name = flowerName?.trim();
  if (!name) throw new Error('Choose a flower name');
  return updateUserProfile(userId, { flower_name: name });
}

export async function getOrCreateFlowerName(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('flower_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data?.flower_name) return data.flower_name;

  const flower = FLOWER_NAMES[Math.floor(Math.random() * FLOWER_NAMES.length)];
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ flower_name: flower })
    .eq('id', userId);

  if (updateError) throw updateError;
  return flower;
}

export function pickRandomFlowerName() {
  return FLOWER_NAMES[Math.floor(Math.random() * FLOWER_NAMES.length)];
}
