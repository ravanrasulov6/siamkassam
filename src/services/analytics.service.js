import { supabase } from '../lib/supabase';

export const analyticsService = {
    /**
     * Get KPIs for a given date range
     * @param {string} businessId
     * @param {string} startDate - ISO date string (YYYY-MM-DD)
     * @param {string} endDate - ISO date string (YYYY-MM-DD)
     */
    async getKPIs(businessId, startDate, endDate) {
        try {
            const startISO = `${startDate}T00:00:00.000Z`;
            const endISO = `${endDate}T23:59:59.999Z`;

            // Fetch everything in parallel
            const [salesRes, expensesRes, debtsRes, payablesRes, debtPaymentsRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('final_amount, paid_amount')
                    .eq('business_id', businessId)
                    .eq('status', 'completed')
                    .gte('created_at', startISO)
                    .lte('created_at', endISO),
                supabase
                    .from('expenses')
                    .select('amount, status')
                    .eq('business_id', businessId)
                    .gte('expense_date', startDate)
                    .lte('expense_date', endDate),
                supabase
                    .from('customers')
                    .select('total_debt')
                    .eq('business_id', businessId)
                    .gt('total_debt', 0),
                supabase
                    .from('payables')
                    .select('amount, paid_amount')
                    .eq('business_id', businessId)
                    .eq('status', 'active'),
                supabase
                    .from('debt_transactions')
                    .select('amount')
                    .eq('business_id', businessId)
                    .eq('transaction_type', 'debt_payment')
                    .gte('created_at', startISO)
                    .lte('created_at', endISO)
            ]);

            const totalAccruedRevenue = salesRes.data ? salesRes.data.reduce((sum, s) => sum + Number(s.final_amount), 0) : 0;
            // Sales paid amounts
            let revenue = salesRes.data ? salesRes.data.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0) : 0;
            // Plus collected debts
            const collectedDebts = debtPaymentsRes.data ? debtPaymentsRes.data.reduce((sum, d) => sum + Number(d.amount), 0) : 0;
            revenue += collectedDebts;

            const totalExpenses = expensesRes.data ? expensesRes.data.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0) : 0;
            const totalPlannedExpenses = expensesRes.data ? expensesRes.data.reduce((sum, e) => sum + Number(e.amount), 0) : 0;
            const totalReceivables = debtsRes.data ? debtsRes.data.reduce((sum, c) => sum + Number(c.total_debt || 0), 0) : 0;

            // Calculate total accrued payables minus what is already paid
            const totalPayables = payablesRes.data ? payablesRes.data.reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0) : 0;

            return {
                totalAccruedRevenue,
                revenue,
                expenses: totalExpenses,
                plannedExpenses: totalPlannedExpenses,
                netProfit: revenue - totalExpenses,
                newDebt: totalReceivables, // Alacaqlar
                payables: totalPayables, // Mənim Borclarım
            };
        } catch (err) {
            console.error('API Error KPIs:', err);
            throw new Error('Göstəricilər yüklənərkən xəta baş verdi');
        }
    },

    /**
     * Get sales trend for a given date range
     */
    async getTrend(businessId, startDate, endDate) {
        const { data, error } = await supabase
            .from('daily_sales_stats')
            .select('*')
            .eq('business_id', businessId)
            .gte('sale_date', startDate)
            .lte('sale_date', endDate)
            .order('sale_date', { ascending: true });

        if (error) throw error;

        // Fill in missing days with 0
        const trend = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const stat = data?.find(row => row.sale_date === dateStr);
            trend.push({
                date: dateStr,
                revenue: stat ? Number(stat.total_revenue) : 0,
                transactions: stat ? Number(stat.total_transactions) : 0
            });
        }

        return trend;
    },

    /**
     * Top selling products in current range
     */
    async getTopProducts(businessId, startDate, endDate) {
        const startISO = startDate ? `${startDate}T00:00:00.000Z` : null;
        const endISO = endDate ? `${endDate}T23:59:59.999Z` : null;

        let query = supabase
            .from('sale_items')
            .select('product_name, quantity, subtotal, sales!inner(business_id, created_at, status)')
            .eq('sales.business_id', businessId)
            .eq('sales.status', 'completed');

        if (startISO) query = query.gte('sales.created_at', startISO);
        if (endISO) query = query.lte('sales.created_at', endISO);

        const { data, error } = await query.limit(1000);

        if (error) throw error;

        const grouped = {};
        data.forEach(item => {
            if (!grouped[item.product_name]) {
                grouped[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
            }
            grouped[item.product_name].qty += Number(item.quantity);
            grouped[item.product_name].revenue += Number(item.subtotal);
        });

        return Object.values(grouped).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }
};
