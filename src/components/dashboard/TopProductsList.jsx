import React from 'react';

export default function TopProductsList({ products }) {
    if (!products || products.length === 0) {
        return (
            <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)' }}>Top Satılan Məhsullar</h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                    Hələ satış edilməyib
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)' }}>Top Satılan Məhsullar</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflowY: 'auto' }}>
                {products.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: idx !== products.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-tertiary)' }}>
                                {idx + 1}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{p.name}</div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>{p.qty} satılıb</div>
                            </div>
                        </div>
                        <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                            ₼{Number(p.revenue).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
