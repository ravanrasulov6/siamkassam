import { supabase } from '../lib/supabase';

export const salesService = {
    /**
     * Complete checkout flow:
     * 1. Create Sale record
     * 2. Insert Sale Items
     * 3. Adjust Inventory (Product Stock & Log)
     * 4. Update Debt (if credit sale)
     */
    async processCheckout({ businessId, cashierId, customerId, items, paymentMethod, paidAmount, discountAmount = 0 }) {
        try {
            const formattedItems = items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: Number(item.quantity),
                sell_price: Number(item.sell_price)
            }));

            const { data: saleId, error } = await supabase.rpc('process_checkout_v3', {
                p_business_id: businessId,
                p_cashier_id: cashierId,
                p_customer_id: customerId || null,
                p_payment_method: paymentMethod,
                p_paid_amount: Number(paidAmount),
                p_discount_amount: Number(discountAmount),
                p_items: formattedItems
            });

            if (error) throw error;
            return { id: saleId };
        } catch (err) {
            console.error('Checkout failed:', err);
            throw new Error('Ödəniş prosesi zamanı xəta baş verdi: ' + err.message);
        }
    },

    async getRecentSales(businessId, limit = 50) {
        const { data, error } = await supabase
            .from('sales')
            .select(`
        *,
        customers(first_name, last_name)
      `)
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
};
