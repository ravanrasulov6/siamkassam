import { supabase } from '../lib/supabase';

export const settingsService = {
    async getBusinessProfile(businessId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateBusinessProfile(businessId, updates) {
        const { data, error } = await supabase
            .from('businesses')
            .update(updates)
            .eq('id', businessId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // For MVP, employees are just users registered in auth, 
    // linked via profiles.business_id. We fetch them here.
    async getEmployees(businessId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('business_id', businessId);

        if (error) throw error;
        return data;
    }
};
