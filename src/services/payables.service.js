import { supabase } from '../lib/supabase';

export const payablesService = {
    /**
     * Get all payables for the business
     * @param {string} businessId
     * @param {object} filters optional object with { status: 'active' | 'completed' }
     */
    async getPayables(businessId, filters = {}) {
        let query = supabase
            .from('payables')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Create a new payable
     * @param {object} payload { business_id, creditor_name, amount, description, due_date }
     */
    async createPayable(payload) {
        const { data, error } = await supabase
            .from('payables')
            .insert({
                business_id: payload.business_id,
                creditor_name: payload.creditor_name,
                amount: parseFloat(payload.amount),
                description: payload.description || null,
                due_date: payload.due_date || null,
                status: 'active',
                paid_amount: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a payable
     * @param {string} id
     */
    async deletePayable(id) {
        const { error } = await supabase
            .from('payables')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Record a payment towards a payable
     * @param {string} id
     * @param {number} paymentAmount
     * @param {number} currentPaidAmount
     * @param {number} totalAmount
     */
    async recordPayment(id, paymentAmount, currentPaidAmount, totalAmount) {
        const newPaidAmount = currentPaidAmount + parseFloat(paymentAmount);
        const newStatus = newPaidAmount >= totalAmount ? 'completed' : 'active';

        const { data, error } = await supabase
            .from('payables')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a payable record
     * @param {string} id
     * @param {object} updates
     */
    async updatePayable(id, updates) {
        const { data, error } = await supabase
            .from('payables')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
