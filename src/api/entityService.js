import { supabase } from '@/lib/supabase';

function parseSort(sort) {
  if (!sort) return { column: 'created_at', ascending: false };
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  const column = field === 'created_date' ? 'created_at' : field;
  return { column, ascending: !descending };
}

function mapRow(row) {
  if (!row) return row;
  const mapped = { ...row };
  if (mapped.created_at && !mapped.created_date) {
    mapped.created_date = mapped.created_at;
  }
  return mapped;
}

export function createEntity(tableName) {
  return {
    async list(sort, limit) {
      const { column, ascending } = parseSort(sort);
      let query = supabase.from(tableName).select('*').order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRow);
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },

    async filter(where = {}, sort, limit) {
      const { column, ascending } = parseSort(sort);
      let query = supabase.from(tableName).select('*');
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      query = query.order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRow);
    },

    async create(row) {
      const { data, error } = await supabase.from(tableName).insert(row).select().single();
      if (error) throw error;
      return mapRow(data);
    },

    async update(id, patch) {
      const { data, error } = await supabase.from(tableName).update(patch).eq('id', id).select().single();
      if (error) throw error;
      return mapRow(data);
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },

    subscribe(callback) {
      const channel = supabase
        .channel(`${tableName}-changes`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: tableName },
          (payload) => {
            callback({ type: 'create', data: mapRow(payload.new) });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}
