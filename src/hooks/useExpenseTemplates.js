import { useState, useEffect, useCallback } from 'react';
import { expenseTemplatesService } from '../services/expenseTemplates.service';
import { useAuth } from '../context/AuthContext';

export function useExpenseTemplates() {
    const { business } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshTemplates = useCallback(async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            const data = await expenseTemplatesService.getAll(business.id);
            setTemplates(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [business?.id]);

    useEffect(() => {
        refreshTemplates();
    }, [refreshTemplates]);

    return { templates, loading, error, refreshTemplates };
}
