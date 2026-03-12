import { supabase } from '../lib/supabase';

export const expenseTemplatesService = {
    async getAll(businessId) {
        const { data, error } = await supabase
            .from('expense_templates')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async create(templateData) {
        const { data, error } = await supabase
            .from('expense_templates')
            .insert(templateData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('expense_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('expense_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
