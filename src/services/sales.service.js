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
            // Calculate totals
            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.sell_price), 0);
            const finalAmount = totalAmount - discountAmount;

            // We will do this via multiple client requests in a theoretical "transaction"
            // Note: Ideally this should be a Supabase RPC to ensure absolute atomicity, 
            // but for MVP we will string them together.

            // 1. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    business_id: businessId,
                    customer_id: customerId || null,
                    cashier_id: cashierId || null,
                    total_amount: totalAmount,
                    discount_amount: discountAmount,
                    final_amount: finalAmount,
                    payment_method: paymentMethod,
                    paid_amount: paidAmount,
                    status: 'completed'
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Prepare items & stock adjustments
            const saleItems = items.map(item => ({
                sale_id: sale.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.sell_price,
                subtotal: item.quantity * item.sell_price
            }));

            const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
            if (itemsError) throw itemsError;

            // 3. Deduct Inventory & Log
            for (const item of items) {
                // Fetch current stock
                const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single();
                if (p) {
                    const newQty = Number(p.stock_quantity) - Number(item.quantity);
                    // Update stock
                    await supabase.from('products').update({ stock_quantity: newQty }).eq('id', item.id);
                    // Log adjustment
                    await supabase.from('product_stock_log').insert({
                        product_id: item.id,
                        business_id: businessId,
                        quantity_change: -item.quantity,
                        reason: 'sale',
                        created_by: cashierId
                    });
                }
            }

            // 4. Handle Debt if credit sale and customer exists
            const debtAmount = finalAmount - paidAmount;
            if (debtAmount > 0 && customerId) {
                const { data: customer } = await supabase.from('customers').select('total_debt').eq('id', customerId).single();
                if (customer) {
                    const newDebt = Number(customer.total_debt) + debtAmount;

                    await supabase.from('debt_transactions').insert({
                        business_id: businessId,
                        customer_id: customerId,
                        reference_sale_id: sale.id,
                        transaction_type: 'debt_increase',
                        amount: debtAmount,
                        balance_after: newDebt,
                        created_by: cashierId,
                        notes: `Satış üzrə borc #${sale.id.split('-')[0]}`
                    });

                    await supabase.from('customers').update({ total_debt: newDebt }).eq('id', customerId);
                }
            }

            return sale;
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
