import React, { useState, lazy, Suspense } from 'react';

// Lazy load heavy tab components to improve Initial Load Time
const ReceivablesTab = lazy(() => import('./ReceivablesTab'));
const PayablesTab = lazy(() => import('./PayablesTab'));

const tabs = [
    {
        id: 'receivables', label: 'Alacaqlar', sublabel: 'Müştəri Borcları', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <polyline points="23 6 23 1 18 1" /><line x1="16" y1="8" x2="23" y2="1" />
            </svg>
        )
    },
    {
        id: 'payables', label: 'Verəcəklər', sublabel: 'Mənim Borclarım', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
        )
    }
];

export default function DebtsPage() {
    const [activeTab, setActiveTab] = useState('receivables');

    return (
        <div style={{ padding: 'var(--space-4) var(--space-4)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' }}>
                    Borclar
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-base)' }}>
                    Müştəri borclarını və firma borclarınızı buradan idarə edin
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="animate-fade-in-up stagger-2" style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 0,
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                display: 'flex',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
                borderBottom: '2px solid var(--color-border-light)'
            }}>
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}</style>
                <div className="no-scrollbar" style={{
                    display: 'flex',
                    gap: 'var(--space-1)',
                    width: '100%'
                }}>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    padding: 'var(--space-3) var(--space-4)',
                                    marginBottom: '-2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    fontSize: 'var(--font-base)',
                                    fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)',
                                    fontFamily: 'var(--font-family)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span style={{ opacity: isActive ? 1 : 0.5 }}>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in-up stagger-3">
                <Suspense fallback={
                    <div className="card glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Məlumatlar yüklənir...</p>
                    </div>
                }>
                    {activeTab === 'receivables' && <ReceivablesTab />}
                    {activeTab === 'payables' && <PayablesTab />}
                </Suspense>
            </div>
        </div>
    );
}
