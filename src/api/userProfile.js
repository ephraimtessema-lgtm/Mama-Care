import { supabase } from '@/lib/supabase';

const FLOWER_NAMES = [
  'Blue Lily', 'Desert Rose', 'Golden Dahlia', 'Silver Orchid', 'Pink Jasmine',
  'Violet Tulip', 'White Magnolia', 'Crimson Poppy', 'Amber Sunflower', 'Jade Hibiscus',
];

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
