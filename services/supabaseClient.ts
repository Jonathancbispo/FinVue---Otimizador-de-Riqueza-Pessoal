
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdldbxybkxokvmctazrx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbGRieHlia3hva3ZtY3RhenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTE1MjAsImV4cCI6MjA4MzAyNzUyMH0.gxDTMhddI0PyDMUtmllMWogx0cEgUvMJnaKuE5yiLiA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const handleError = (error: any, context: string) => {
  const message = error?.message || 'Erro desconhecido';
  const code = error?.code || 'N/A';
  console.error(`[Supabase ${context}] Code: ${code} - Message: ${message}`);
  // PGRST205 é comumente falta de índice único para upsert
  return { message, code, full: error };
};

export const saveFinancialData = async (userId: string, data: any) => {
  // Importante: Para o upsert funcionar, a tabela financial_data DEVE ter 
  // um UNIQUE INDEX nas colunas (user_id, year).
  const { error } = await supabase
    .from('financial_data')
    .upsert(
      { 
        user_id: userId, 
        year: new Date().getFullYear(),
        data: data,
        updated_at: new Date().toISOString()
      }, 
      { onConflict: 'user_id,year' }
    );

  if (error) {
    const handled = handleError(error, 'Save');
    throw handled;
  }
};

export const loadFinancialData = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('financial_data')
      .select('data')
      .eq('user_id', userId)
      .eq('year', new Date().getFullYear())
      .maybeSingle();

    if (error) throw error;
    return data?.data || null;
  } catch (err) {
    throw handleError(err, 'Load');
  }
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
  
  if (error) throw handleError(error, 'Asset Save');
};

export const getUserAssets = async (userId: string) => {
  const { data, error } = await supabase
    .from('generated_assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw handleError(error, 'Asset Load');
  return data || [];
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
