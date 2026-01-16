import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DASHBOARD_QUERY_KEY = ['dashboardData'];

// --- Fetch Top 5 Critical Materials ---
interface CriticalMaterialData {
  nome: string;
  codigo: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade_medida: string;
  deficit: number;
}

const fetchCriticalMaterials = async (): Promise<CriticalMaterialData[]> => {
  // Nota: A política RLS 'materiais_select_all' permite que admins leiam todos os materiais.
  const { data: materials, error } = await supabase
    .from('materiais')
    .select('nome, codigo, quantidade_atual, quantidade_minima, unidade_medida')
    .order('quantidade_atual', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const critical = (materials as Material[])
    .filter(m => m.quantidade_atual <= m.quantidade_minima)
    .map(m => ({
      nome: m.nome,
      codigo: m.codigo,
      quantidade_atual: m.quantidade_atual,
      quantidade_minima: m.quantidade_minima,
      unidade_medida: m.unidade_medida,
      deficit: m.quantidade_minima - m.quantidade_atual,
    }))
    .sort((a, b) => b.deficit - a.deficit) // Ordena pelo maior déficit
    .slice(0, 5); // Top 5

  return critical;
};

export const useCriticalMaterials = () => {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'critical'],
    queryFn: fetchCriticalMaterials,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// --- Fetch Movement Trend (Last 30 Days) ---
interface MovementTrendData {
  name: string; // Corrigido de 'date' para 'name'
  entradas: number;
  saidas: number;
}

const fetchMovementTrend = async (): Promise<MovementTrendData[]> => {
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  // Busca todas as movimentações aprovadas nos últimos 30 dias
  const { data: movements, error } = await supabase
    .from('movimentacoes')
    .select('created_at, tipo, quantidade')
    .eq('status', 'aprovada')
    .gte('created_at', thirtyDaysAgo);

  if (error) {
    throw new Error(error.message);
  }

  // Agregação dos dados por dia
  const dailyDataMap = new Map<string, { entradas: number; saidas: number }>();

  // Inicializa o mapa com os últimos 30 dias
  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i);
    const dateKey = format(date, 'dd/MM', { locale: ptBR });
    dailyDataMap.set(dateKey, { entradas: 0, saidas: 0 });
  }

  (movements as any[]).forEach(m => {
    const dateKey = format(new Date(m.created_at), 'dd/MM', { locale: ptBR });
    const entry = dailyDataMap.get(dateKey) || { entradas: 0, saidas: 0 };

    if (m.tipo === 'entrada' || m.tipo === 'ajuste') {
      entry.entradas += m.quantidade;
    } else if (m.tipo === 'saida') {
      entry.saidas += m.quantidade;
    }
    dailyDataMap.set(dateKey, entry);
  });

  // Converte o mapa para o formato de array, garantindo a ordem cronológica
  const trendData: MovementTrendData[] = Array.from(dailyDataMap.entries())
    .map(([date, data]) => ({
      name: date,
      entradas: data.entradas,
      saidas: data.saidas,
    }))
    .sort((a, b) => {
      // Ordena as datas (dd/MM)
      const [dayA, monthA] = a.name.split('/').map(Number);
      const [dayB, monthB] = b.name.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });

  return trendData;
};

export const useMovementTrend = () => {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'trend'],
    queryFn: fetchMovementTrend,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};