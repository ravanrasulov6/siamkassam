import { useState, useEffect, useCallback } from 'react';
import { expensesService } from '../services/expenses.service';
import { useAuth } from '../context/AuthContext';

export function useExpenses(initialFilters = {}) {
    const { business } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ search: '', category: '', status: '', ...initialFilters });

    const fetchExpenses = useCallback(async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            setError(null);
            let data = await expensesService.getAll(business.id);

            // Client-side filtering
            if (filters.search) {
                const query = filters.search.toLowerCase();
                data = data.filter(e => e.notes && e.notes.toLowerCase().includes(query));
            }
            if (filters.category) {
                data = data.filter(e => e.category === filters.category);
            }

            if (filters.status) {
                data = data.filter(e => e.status === filters.status);
            }

            setExpenses(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [business?.id, filters]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return {
        expenses,
        loading,
        error,
        filters,
        setFilters,
        refreshExpenses: fetchExpenses
    };
}
