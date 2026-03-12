import React from 'react';
import { Plus } from 'react-feather';

export default function ProductGrid({ products, onAdd, loading }) {
    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="card skeleton" style={{ height: '160px', padding: 0 }} />
                ))}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                <h2>Məhsul tapılmadı</h2>
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--space-4)',
            alignContent: 'start'
        }}>
            {products.map(product => {
                const isOutOfStock = Number(product.stock_quantity) <= 0;

                return (
                    <button
                        key={product.id}
                        className="card card-animate"
                        style={{
                            padding: 'var(--space-4)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            textAlign: 'left',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.6 : 1,
                            background: 'var(--color-surface)',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid var(--color-border-light)',
                            borderRadius: 'var(--radius-lg)',
                            transition: 'all 0.2s ease-out'
                        }}
                        onClick={() => !isOutOfStock && onAdd(product)}
                    >
                        {/* Decorative background element */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '60px',
                            height: '60px',
                            background: product.categories?.color || 'var(--color-primary)',
                            opacity: 0.05,
                            borderRadius: '50%'
                        }} />

                        {/* Category Indicator Tag */}
                        <div style={{
                            marginBottom: 'var(--space-3)',
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: product.categories?.color || 'var(--color-text-tertiary)',
                            padding: '2px 8px',
                            background: (product.categories?.color ? `${product.categories.color}15` : 'var(--color-bg)'),
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            {product.categories?.name || 'Kateqoriyasız'}
                        </div>

                        <h3 style={{
                            fontSize: 'var(--font-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text)',
                            marginBottom: 'var(--space-4)',
                            lineHeight: '1.4',
                            height: '2.8em',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {product.name}
                        </h3>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            width: '100%',
                            marginTop: 'auto'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>
                                    {isOutOfStock ? 'Stokda yoxdur' : `${product.stock_quantity} ${product.unit}`}
                                </span>
                                <span style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-black)', color: 'var(--color-primary)' }}>
                                    ₼{Number(product.sell_price).toFixed(2)}
                                </span>
                            </div>

                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-md)',
                                background: isOutOfStock ? 'var(--color-bg)' : 'var(--color-primary)',
                                color: isOutOfStock ? 'var(--color-text-tertiary)' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isOutOfStock ? 'none' : '0 4px 8px rgba(79, 70, 229, 0.2)'
                            }}>
                                <Plus size={18} />
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
