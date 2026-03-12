import { supabase } from '../lib/supabase';

export const expensesService = {
    async getAll(businessId, limit = 100) {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('business_id', businessId)
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    async create(expenseData) {
        const { data, error } = await supabase
            .from('expenses')
            .insert(expenseData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async toggleStatus(id, currentStatus) {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        return this.update(id, { status: newStatus });
    },

    async delete(id) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
