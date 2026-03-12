import { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { productsService } from '../../services/products.service';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import ProductFormModal from './ProductFormModal';
import CategoryManagerModal from './CategoryManagerModal';
import QuickStockEdit from './QuickStockEdit';

export default function ProductsPage() {
    const { products, categories, loading, filters, setFilters, refreshProducts, refreshCategories } = useProducts({
        search: '',
        category: '',
        stockStatus: ''
    });

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    function handleAddProduct() {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    }

    function handleEditProduct(product) {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    }

    async function handleDeleteProduct(id) {
        if (!window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) return;
        try {
            await productsService.delete(id);
            refreshProducts();
        } catch (err) {
            alert('Silinmə xətası: ' + err.message);
        }
    }

    const columns = [
        {
            header: 'Məhsul',
            field: 'name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div className="avatar">
                        {row.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{row.name}</div>
                        {row.barcode && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>{row.barcode}</div>}
                    </div>
                </div>
            )
        },
        {
            header: 'Kateqoriya',
            field: 'categories',
            render: (row) => {
                if (!row.categories) return '-';
                return (
                    <Badge variant="neutral" style={{ borderLeft: `3px solid ${row.categories.color || '#4F46E5'}` }}>
                        {row.categories.name}
                    </Badge>
                );
            }
        },
        {
            header: 'Alış qiyməti',
            field: 'buy_price',
            render: (row) => `₼${Number(row.buy_price).toFixed(2)}`
        },
        {
            header: 'Satış qiyməti',
            field: 'sell_price',
            render: (row) => <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>₼{Number(row.sell_price).toFixed(2)}</span>
        },
        {
            header: 'Stok',
            field: 'stock_quantity',
            render: (row) => {
                const qty = Number(row.stock_quantity);
                const min = Number(row.min_stock_threshold);
                let status = 'success';
                let statusText = 'Normal';

                if (qty <= 0) {
                    status = 'danger';
                    statusText = 'Bitib';
                } else if (qty <= min) {
                    status = 'warning';
                    statusText = 'Aşağı';
                }

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: `var(--color-${status})`
                            }} title={statusText} />
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{row.unit}</span>
                        </div>
                        <QuickStockEdit product={row} onUpdate={refreshProducts} />
                    </div>
                );
            }
        },
        {
            header: 'Əməliyyatlar',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleEditProduct(row); }}
                    >
                        ✏️
                    </button>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(row.id); }}
                        style={{ color: 'var(--color-danger)' }}
                    >
                        🗑️
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: 'var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-1)' }}>Məhsullar</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Bütün məhsul və xidmətlərinizi buradan idarə edin</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)}>
                        📂 Kateqoriyalar
                    </button>
                    <button className="btn btn-primary" onClick={handleAddProduct}>
                        + Yeni Məhsul
                    </button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-tertiary)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Məhsul adı və ya barkod ilə axtar..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            style={{ paddingLeft: '32px', background: 'var(--color-bg)', borderColor: 'var(--color-border-light)' }}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-light)' }}
                    >
                        <option value="">Bütün kateqoriyalar</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
                    <select
                        value={filters.stockStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-light)' }}
                    >
                        <option value="">Bütün stok</option>
                        <option value="low">Aşağı stok</option>
                        <option value="out">Bitmiş stok</option>
                    </select>
                </div>
            </div>

            {/* Data Table Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <DataTable
                    columns={columns}
                    data={products}
                    loading={loading}
                    emptyStateText="Hələ heç bir məhsul əlavə edilməyib."
                    emptyStateAction={
                        <button className="btn btn-primary" onClick={handleAddProduct}>
                            İlk Məhsulu Əlavə Et
                        </button>
                    }
                />
            </div>

            {/* Modals */}
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                productToEdit={editingProduct}
                categories={categories}
                onSaved={refreshProducts}
            />

            <CategoryManagerModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={categories}
                onCategoryAdded={() => { refreshCategories(); refreshProducts(); }}
            />
        </div>
    );
}
