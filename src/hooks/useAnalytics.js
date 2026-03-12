import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analytics.service';
import { salesService } from '../services/sales.service';
import { useAuth } from '../context/AuthContext';

/**
 * Helper to get common date ranges
 */
function getDateRange(rangeKey) {
    const now = new Date();
    const end = now.toISOString().split('T')[0];

    switch (rangeKey) {
        case 'today': {
            return { start: end, end };
        }
        case 'this_week': {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay()); // Sunday
            return { start: d.toISOString().split('T')[0], end };
        }
        case 'this_month': {
            const d = new Date();
            d.setDate(1);
            return { start: d.toISOString().split('T')[0], end };
        }
        case 'last_month': {
            const d = new Date();
            d.setMonth(d.getMonth() - 1);
            d.setDate(1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: d.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] };
        }
        case 'last_7_days':
        default: {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return { start: d.toISOString().split('T')[0], end };
        }
    }
}

export function useAnalytics() {
    const { business } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rangeKey, setRangeKey] = useState('this_month');

    const [dateRange, setDateRange] = useState(() => getDateRange('this_month'));
    const [kpis, setKpis] = useState({ revenue: 0, expenses: 0, netProfit: 0, newDebt: 0 });
    const [trend, setTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentSales, setRecentSales] = useState([]);

    // When rangeKey changes, recalculate dateRange
    useEffect(() => {
        setDateRange(getDateRange(rangeKey));
    }, [rangeKey]);

    const fetchDashboardData = useCallback(async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            setError(null);

            const [kpiData, trendData, productsData, salesData] = await Promise.all([
                analyticsService.getKPIs(business.id, dateRange.start, dateRange.end),
                analyticsService.getTrend(business.id, dateRange.start, dateRange.end),
                analyticsService.getTopProducts(business.id, dateRange.start, dateRange.end),
                salesService.getRecentSales(business.id, 5)
            ]);

            setKpis(kpiData);
            setTrend(trendData);
            setTopProducts(productsData);
            setRecentSales(salesData);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [business?.id, dateRange]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        loading,
        error,
        kpis,
        trend,
        topProducts,
        recentSales,
        rangeKey,
        setRangeKey,
        dateRange,
        refreshAnalytics: fetchDashboardData
    };
}
