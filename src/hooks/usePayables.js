import { useState, useCallback, useEffect } from 'react';
import { payablesService } from '../services/payables.service';
import { useAuth } from '../context/AuthContext';

export function usePayables(initialFilters = { status: 'active' }) {
    const { business } = useAuth();
    const [payables, setPayables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchPayables = useCallback(async () => {
        if (!business?.id) return;

        try {
            setLoading(true);
            setError(null);
            const statusFilter = filters.status === 'all' ? undefined : filters.status;
            const data = await payablesService.getPayables(business.id, { status: statusFilter });
            setPayables(data || []);
        } catch (err) {
            console.error('Failed to fetch payables:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [business?.id, filters.status]);

    useEffect(() => {
        fetchPayables();
    }, [fetchPayables]);

    return {
        payables,
        loading,
        error,
        filters,
        setFilters,
        refreshPayables: fetchPayables
    };
}
