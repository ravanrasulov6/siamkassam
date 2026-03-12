import { useState, useEffect, useCallback } from 'react';
import { customersService } from '../services/customers.service';
import { useAuth } from '../context/AuthContext';

export function useCustomers(initialFilters = {}) {
    const { business } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '', ...initialFilters });

    const fetchCustomers = useCallback(async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            setError(null);
            let data = await customersService.getAll(business.id);

            // Client-side filtering
            if (filters.search) {
                const query = filters.search.toLowerCase();
                data = data.filter(c =>
                    c.first_name.toLowerCase().includes(query) ||
                    (c.last_name && c.last_name.toLowerCase().includes(query)) ||
                    (c.phone && c.phone.includes(query))
                );
            }

            if (filters.status === 'borclu') {
                data = data.filter(c => Number(c.total_debt) > 0);
            }

            setCustomers(data);
        } catch (err) {
            console.error('Müştəriləri yükləmək mümkün olmadı:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [business?.id, filters]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return {
        customers,
        loading,
        error,
        filters,
        setFilters,
        refreshCustomers: fetchCustomers
    };
}
