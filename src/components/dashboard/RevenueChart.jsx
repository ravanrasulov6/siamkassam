import React from 'react';

// Basic Custom CSS Bar Chart for MVP, avoiding bulky libraries.
export default function RevenueChart({ data }) {
    if (!data || data.length === 0) {
        return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Data yoxdur</div>;
    }

    // Find max revenue for scaling
    const maxRevenue = Math.max(...data.map(d => Number(d.revenue)), 1);

    return (
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)' }}>Satış Qrafiki (Son 7 Gün)</h3>

            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 'var(--space-2) 0', gap: 'var(--space-2)' }}>
                {data.map((day, i) => {
                    const heightPct = (Number(day.revenue) / maxRevenue) * 100;
                    const dateObj = new Date(day.date);
                    const dayName = dateObj.toLocaleDateString('az-AZ', { weekday: 'short' });

                    return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>

                            {/* Tooltip emulation - simple value on top */}
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)', opacity: heightPct > 0 ? 1 : 0 }}>
                                {Math.round(day.revenue)}
                            </div>

                            {/* Bar */}
                            <div style={{
                                width: '100%',
                                maxWidth: '40px',
                                height: `${heightPct}%`,
                                minHeight: '4px',
                                background: 'var(--color-primary)',
                                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                transition: 'height 0.3s ease'
                            }} />

                            {/* x-axis label */}
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                                {dayName}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
