import React from 'react';
import Badge from '../ui/Badge';

export default function RecentSalesList({ sales }) {
    if (!sales || sales.length === 0) {
        return (
            <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)' }}>Son Əməliyyatlar</h3>
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    Satış tarixçəsi boşdur
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginTop: 'var(--space-6)', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)' }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-bold)' }}>Son Əməliyyatlar</h3>
            </div>

            <div className="table-container" style={{ maxHeight: 'none' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tarix</th>
                            <th>Müştəri</th>
                            <th>Ödəniş</th>
                            <th>Məbləğ</th>
                            <th style={{ textAlign: 'right' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => {
                            const customerName = sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name || ''}`.trim() : 'Standart Müştəri';

                            let methodBadge = <Badge variant="neutral">{sale.payment_method}</Badge>;
                            if (sale.payment_method === 'cash') methodBadge = <Badge variant="success">Nəğd</Badge>;
                            if (sale.payment_method === 'card') methodBadge = <Badge variant="primary">Kart</Badge>;
                            if (sale.payment_method === 'credit') methodBadge = <Badge variant="warning">Nisyə</Badge>;

                            const isCompleted = sale.status === 'completed';

                            return (
                                <tr key={sale.id}>
                                    <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>#{sale.id.split('-')[0]}</td>
                                    <td>{new Date(sale.created_at).toLocaleString('az-AZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{customerName}</td>
                                    <td>{methodBadge}</td>
                                    <td style={{ fontWeight: 'var(--font-weight-bold)' }}>₼{Number(sale.final_amount).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Badge variant={isCompleted ? 'success' : 'danger'}>
                                            {isCompleted ? 'Uğurlu' : sale.status}
                                        </Badge>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
