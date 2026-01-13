
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdldbxybkxokvmctazrx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbGRieHlia3hva3ZtY3RhenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTE1MjAsImV4cCI6MjA4MzAyNzUyMH0.gxDTMhddI0PyDMUtmllMWogx0cEgUvMJnaKuE5yiLiA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const saveFinancialData = async (userId: string, data: any) => {
  const { error } = await supabase
    .from('financial_data')
    .upsert({ 
      user_id: userId, 
      year: new Date().getFullYear(),
      data: data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,year' });

  if (error) throw error;
};

export const loadFinancialData = async (userId: string) => {
  const { data, error } = await supabase
    .from('financial_data')
    .select('data')
    .eq('user_id', userId)
    .eq('year', new Date().getFullYear())
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data?.data || null;
};

export const saveGeneratedAsset = async (userId: string, prompt: string, imageUrl: string, category: string = 'wealth_vision') => {
  const { error } = await supabase
    .from('generated_assets')
    .insert({
      user_id: userId,
      prompt,
      image_url: imageUrl,
      category
    });
  
  if (error) throw error;
};

export const updateUserProfile = async (displayName: string) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName }
  });
  if (error) throw error;
  return data;
};

export const updateUserPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: password
  });
  if (error) throw error;
  return data;
};
