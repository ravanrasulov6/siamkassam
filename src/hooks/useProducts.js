import { useState, useEffect, useCallback } from 'react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { useAuth } from '../context/AuthContext';

export function useProducts(initialFilters = {}) {
    const { business } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchProducts = useCallback(async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            const data = await productsService.getAll(business.id, filters);
            setProducts(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [business?.id, filters]);

    const fetchCategories = useCallback(async () => {
        if (!business?.id) return;
        try {
            const cats = await categoriesService.getAll(business.id);
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }, [business?.id]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return {
        products,
        categories,
        loading,
        error,
        filters,
        setFilters,
        refreshProducts: fetchProducts,
        refreshCategories: fetchCategories,
    };
}
