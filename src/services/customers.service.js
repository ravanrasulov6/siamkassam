import { supabase } from '../lib/supabase';

export const customersService = {
    async getAll(businessId) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(customerData) {
        const { data, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
