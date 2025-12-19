import { supabase } from '@/lib/customSupabaseClient';

/**
 * Busca estatísticas do dashboard administrativo
 * Chama a função RPC get_admin_dashboard_stats
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getDashboardStats() {
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

    if (error) {
      console.error('[adminService] Erro ao buscar estatísticas:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[adminService] Erro inesperado:', error);
    return { data: null, error };
  }
}

