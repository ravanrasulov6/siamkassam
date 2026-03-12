import { supabase } from '../lib/supabase';

export const productsService = {
    async getAll(businessId, filters = {}) {
        if (!businessId) throw new Error('Business ID is required');

        let query = supabase
            .from('products')
            .select(`
        *,
        categories (id, name, color)
      `)
            .eq('business_id', businessId)
            .eq('is_active', true);

        if (filters.category) {
            query = query.eq('category_id', filters.category);
        }

        if (filters.search) {
            // Search by name or barcode
            query = query.or(`name.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
        }

        if (filters.stockStatus) {
            if (filters.stockStatus === 'low') {
                // Here we can't do a direct column comparison in JS client easily without a view or rpc,
                // so we fetch and filter in JS, OR we just use a raw filter if the API supports it.
                // Actually, Supabase allows filtering where column A <= column B:
                // Unfortunately standard JS syntax .lte('stock_quantity', 'min_stock_threshold') compares to string.
                // For simplicity, we'll pull all active and filter client-side for low stock, or use an RPC later.
                // As a temporary workaround, we skip the server-side complex filter here and do it in the hook.
            } else if (filters.stockStatus === 'out') {
                query = query.lte('stock_quantity', 0);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Client-side filtering for 'low' stock since we need stock_quantity <= min_stock_threshold AND stock_quantity > 0
        if (filters.stockStatus === 'low') {
            return data.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_threshold);
        }

        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories (name)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async recordStockAdjustment(productId, businessId, quantityChange, reason, note = '') {
        // 1. Update product stock
        // Use RPC if possible for atomic update, but simple approach: fetch, update.
        // Better yet, we can rely on a database function for POS, but for manual adjustments:
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        const newQuantity = Number(product.stock_quantity) + Number(quantityChange);

        const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq('id', productId);

        if (updateError) throw updateError;

        // 2. Log adjustment
        const { error: logError } = await supabase
            .from('product_stock_log')
            .insert({
                product_id: productId,
                business_id: businessId,
                quantity_change: quantityChange,
                reason: reason,
                note: note
            });

        if (logError) throw logError;

        return newQuantity;
    },

    async delete(id) {
        // Soft delete
        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
