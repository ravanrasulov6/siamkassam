import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../context/AuthContext';
import KPICard from '../../components/dashboard/KPICard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import TopProductsList from '../../components/dashboard/TopProductsList';
import RecentSalesList from '../../components/dashboard/RecentSalesList';
import AlertSection from '../../components/dashboard/AlertSection';

const RANGE_OPTIONS = [
    { value: 'today', label: 'Bu gün' },
    { value: 'this_week', label: 'Bu həftə' },
    { value: 'this_month', label: 'Bu ay' },
    { value: 'last_month', label: 'Keçən ay' },
    { value: 'last_7_days', label: 'Son 7 gün' },
];

function KPISkeleton() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card" style={{ padding: 'var(--space-6)' }}>
                    <div className="skeleton skeleton-text-sm" style={{ marginBottom: 'var(--space-3)' }} />
                    <div className="skeleton skeleton-title" style={{ width: '70%' }} />
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const { loading, error, kpis, trend, topProducts, recentSales, rangeKey, setRangeKey, dateRange } = useAnalytics();
    const { profile } = useAuth();

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Sabahınız xeyir';
        if (hour < 18) return 'Günortanız xeyir';
        return 'Axşamınız xeyir';
    };

    if (error) {
        return (
            <div style={{ padding: 'var(--space-6)' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', padding: 'var(--space-6)' }}>
                    <h3 style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>Xəta baş verdi</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--space-8) var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-1)', letterSpacing: '-0.02em' }}>
                        {greeting()}, {profile?.first_name || 'İstifadəçi'} 👋
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-base)' }}>
                        {dateRange.start} — {dateRange.end} dövr üzrə analitika
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRangeKey(opt.value)}
                            className={rangeKey === opt.value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                            style={{ borderRadius: 'var(--radius-full)' }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <AlertSection />

            {/* KPIs Row */}
            {loading && !kpis ? (
                <KPISkeleton />
            ) : (
                <div className="grid-cols-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                    <KPICard title="Dövriyyə (Ümumi Satış)" value={kpis?.totalAccruedRevenue || 0} type="secondary" className="stagger-1 glass-card" />
                    <KPICard title="Nağd Giriş (Kassa)" value={kpis?.revenue || 0} type="primary" className="stagger-2 glass-card" />
                    <KPICard title="Nağd Çıxış (Xərclər)" value={kpis?.expenses || 0} type="warning" className="stagger-3 glass-card" />
                    <KPICard title="Xalis Mənfəət" value={kpis?.netProfit || 0} type="success" className="stagger-4 glass-card" />
                    <KPICard title="Alacaqlar (Müştəri Borcu)" value={kpis?.newDebt || 0} type="info" className="stagger-5 glass-card" />
                    <KPICard title="Verəcəklər (Mənim Borcum)" value={kpis?.payables || 0} type="danger" className="stagger-6 glass-card" />
                </div>
            )}

            {/* Charts Row */}
            <div className="animate-fade-in-up stagger-4 grid-cols-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <div className="glass-card" style={{ padding: 'var(--space-4)' }}><RevenueChart data={trend} /></div>
                <div className="glass-card" style={{ padding: 'var(--space-4)' }}><TopProductsList products={topProducts} /></div>
            </div>

            {/* Bottom Row */}
            <div className="animate-fade-in-up stagger-5 glass-card" style={{ padding: 'var(--space-4)' }}>
                <RecentSalesList sales={recentSales} />
            </div>
        </div>
    );
}
