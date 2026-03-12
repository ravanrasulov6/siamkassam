import { supabase } from '../lib/supabase';

export const debtsService = {
    async getTransactions(businessId, entityId, type = 'customer') {
        const field = type === 'customer' ? 'customer_id' : 'supplier_id';
        const { data, error } = await supabase
            .from('debt_transactions')
            .select('*')
            .eq('business_id', businessId)
            .eq(field, entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async recordPayment({ businessId, customerId, amount, paymentMethod, userId, notes }) {
        try {
            // 1. Get current debt
            const { data: customer, error: fetchErr } = await supabase
                .from('customers')
                .select('total_debt')
                .eq('id', customerId)
                .single();

            if (fetchErr) throw fetchErr;

            const newDebt = Number(customer.total_debt) - Number(amount);

            // 2. Log transaction
            const { error: logErr } = await supabase
                .from('debt_transactions')
                .insert({
                    business_id: businessId,
                    customer_id: customerId,
                    transaction_type: 'debt_payment',
                    amount: amount,
                    balance_after: newDebt,
                    payment_method: paymentMethod,
                    created_by: userId,
                    notes: notes || 'Borc ödənişi'
                });

            if (logErr) throw logErr;

            // 3. Update customer
            const { error: updateErr } = await supabase
                .from('customers')
                .update({ total_debt: newDebt })
                .eq('id', customerId);

            if (updateErr) throw updateErr;

            return newDebt;

        } catch (err) {
            console.error('Payment recording failed:', err);
            throw new Error('Ödəniş qeyd edilərkən xəta baş verdi');
        }
    },

    async recordDebtIncrease({ businessId, customerId, amount, userId, notes }) {
        try {
            // 1. Get current debt
            const { data: customer, error: fetchErr } = await supabase
                .from('customers')
                .select('total_debt')
                .eq('id', customerId)
                .single();

            if (fetchErr) throw fetchErr;

            const newDebt = Number(customer.total_debt || 0) + Number(amount);

            // 2. Log transaction
            const { error: logErr } = await supabase
                .from('debt_transactions')
                .insert({
                    business_id: businessId,
                    customer_id: customerId,
                    transaction_type: 'debt_increase',
                    amount: amount,
                    balance_after: newDebt,
                    created_by: userId,
                    notes: notes || 'Borc əlavə edildi'
                });

            if (logErr) throw logErr;

            // 3. Update customer
            const { error: updateErr } = await supabase
                .from('customers')
                .update({ total_debt: newDebt })
                .eq('id', customerId);

            if (updateErr) throw updateErr;

            return newDebt;

        } catch (err) {
            console.error('Debt recording failed:', err);
            throw new Error('Borc qeyd edilərkən xəta baş verdi');
        }
    }
};
