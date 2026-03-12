import { supabase } from '../lib/supabase';

export const reportsService = {
    async getGeneralReport(businessId, startDate, endDate) {
        // Basic summation from sales and expenses
        const { data: sales, error: sErr } = await supabase
            .from('sales')
            .select('final_amount, paid_amount, created_at')
            .eq('business_id', businessId)
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (sErr) throw sErr;

        const { data: expenses, error: eErr } = await supabase
            .from('expenses')
            .select('amount, expense_date')
            .eq('business_id', businessId)
            .gte('expense_date', startDate.split('T')[0])
            .lte('expense_date', endDate.split('T')[0]);

        if (eErr) throw eErr;

        const { data: debtPayments, error: dErr } = await supabase
            .from('debt_transactions')
            .select('amount')
            .eq('business_id', businessId)
            .eq('transaction_type', 'debt_payment')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (dErr) throw dErr;

        const totalSales = sales.reduce((sum, s) => sum + Number(s.final_amount), 0);
        const salesRevenue = sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
        const debtRevenue = debtPayments.reduce((sum, d) => sum + Number(d.amount), 0);
        const collectedRevenue = salesRevenue + debtRevenue;
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        return {
            totalSales,
            collectedRevenue,
            totalExpenses,
            netProfit: collectedRevenue - totalExpenses,
            salesCount: sales.length,
            expensesCount: expenses.length
        };
    },

    async getSalesPerformance(businessId, startDate, endDate) {
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
                id,
                final_amount,
                paid_amount,
                created_at,
                sale_items (
                    product_id,
                    quantity,
                    unit_price,
                    products (name)
                )
            `)
            .eq('business_id', businessId)
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (error) throw error;

        // Aggregate by product
        const productMap = {};
        sales.forEach(sale => {
            sale.sale_items.forEach(item => {
                const name = item.products?.name || 'Naməlum Məhsul';
                if (!productMap[name]) {
                    productMap[name] = { name, quantity: 0, revenue: 0 };
                }
                productMap[name].quantity += Number(item.quantity);
                productMap[name].revenue += Number(item.quantity) * Number(item.unit_price);
            });
        });

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Aggregate by date
        const dailyMap = {};
        sales.forEach(sale => {
            const date = sale.created_at.split('T')[0];
            if (!dailyMap[date]) dailyMap[date] = 0;
            dailyMap[date] += Number(sale.final_amount);
        });

        const dailyTrend = Object.entries(dailyMap)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            topProducts,
            dailyTrend,
            averageTicketSize: sales.length ? sales.reduce((sum, s) => sum + Number(s.final_amount), 0) / sales.length : 0
        };
    },

    async getExpensesAnalysis(businessId, startDate, endDate) {
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('business_id', businessId)
            .gte('expense_date', startDate.split('T')[0])
            .lte('expense_date', endDate.split('T')[0]);

        if (error) throw error;

        const categoryMap = {};
        expenses.forEach(e => {
            if (!categoryMap[e.category]) {
                categoryMap[e.category] = { category: e.category, amount: 0, count: 0 };
            }
            categoryMap[e.category].amount += Number(e.amount);
            categoryMap[e.category].count += 1;
        });

        return {
            categories: Object.values(categoryMap).sort((a, b) => b.amount - a.amount),
            topExpenses: [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10),
            totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0)
        };
    },

    async getDebtAnalysis(businessId) {
        // High level debt overview
        const { data: customers, error } = await supabase
            .from('customers')
            .select('id, first_name, last_name, total_debt, updated_at')
            .eq('business_id', businessId)
            .gt('total_debt', 0)
            .order('total_debt', { ascending: false });

        if (error) throw error;

        const totalReceivable = customers.reduce((sum, c) => sum + Number(c.total_debt), 0);

        // Risk profiling (simplified: updated > 30 days ago and still owes)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const highRisk = customers.filter(c => new Date(c.updated_at) < thirtyDaysAgo);

        return {
            totalReceivable,
            topDebtors: customers.slice(0, 10),
            highRiskDebtorsCount: highRisk.length,
            highRiskAmount: highRisk.reduce((sum, c) => sum + Number(c.total_debt), 0)
        };
    }
};
