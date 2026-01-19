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
  name: string;
  entradas: number;
  saidas: number;
  [key: string]: string | number; // Adicionado para compatibilidade com ChartData
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

// --- Fetch Zero Stock Count ---
const fetchZeroStockCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('materiais')
    .select('id', { count: 'exact' })
    .eq('quantidade_atual', 0);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
};

export const useZeroStockCount = () => {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'zeroStock'],
    queryFn: fetchZeroStockCount,
    staleTime: 1000 * 60 * 5,
  });
};

// --- Fetch Total Movements Last 30 Days ---
const fetchTotalMovementsLast30Days = async (): Promise<number> => {
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { count, error } = await supabase
    .from('movimentacoes')
    .select('id', { count: 'exact' })
    .eq('status', 'aprovada')
    .gte('created_at', thirtyDaysAgo);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
};

export const useTotalMovementsLast30Days = () => {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'totalMovements'],
    queryFn: fetchTotalMovementsLast30Days,
    staleTime: 1000 * 60 * 10,
  });
};

// --- Fetch Top 5 Moving Items (Last 30 Days) ---
interface TopMovingItem {
  material_id: string;
  nome: string;
  codigo: string;
  total_quantidade: number;
  unidade_medida: string;
}

const fetchTopMovingItems = async (): Promise<TopMovingItem[]> => {
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  // 1. Buscar movimentações aprovadas nos últimos 30 dias
  const { data: movements, error: movementsError } = await supabase
    .from('movimentacoes')
    .select('material_id, quantidade')
    .eq('status', 'aprovada')
    .gte('created_at', thirtyDaysAgo);

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  // 2. Agrupar e somar a quantidade por material_id
  const aggregatedData = movements.reduce((acc, movement) => {
    acc[movement.material_id] = (acc[movement.material_id] || 0) + movement.quantidade;
    return acc;
  }, {} as Record<string, number>);

  // 3. Converter para array e ordenar
  const topMaterialIds = Object.entries(aggregatedData)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
    .map(([id]) => id);

  if (topMaterialIds.length === 0) {
    return [];
  }

  // 4. Buscar detalhes dos materiais
  const { data: materials, error: materialsError } = await supabase
    .from('materiais')
    .select('id, nome, codigo, unidade_medida')
    .in('id', topMaterialIds);

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  // 5. Combinar e formatar o resultado
  const topMovingItems: TopMovingItem[] = materials.map(material => ({
    material_id: material.id,
    nome: material.nome,
    codigo: material.codigo,
    unidade_medida: material.unidade_medida,
    total_quantidade: aggregatedData[material.id],
  }));

  // Garantir que a ordem seja pela quantidade total (do maior para o menor)
  topMovingItems.sort((a, b) => b.total_quantidade - a.total_quantidade);

  return topMovingItems;
};

export const useTopMovingItems = () => {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'topMoving'],
    queryFn: fetchTopMovingItems,
    staleTime: 1000 * 60 * 10,
  });
};