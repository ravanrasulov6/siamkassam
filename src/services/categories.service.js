import { supabase } from '../lib/supabase';

export const categoriesService = {
    async getAll(businessId) {
        if (!businessId) throw new Error('Business ID is required');

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('business_id', businessId)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async create(categoryData) {
        const { data, error } = await supabase
            .from('categories')
            .insert(categoryData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
