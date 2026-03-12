import { useState, useEffect } from 'react';
import { reportsService } from '../../services/reports.service';
import { aiService } from '../../services/ai.service';
import { messagesService } from '../../services/messages.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BarChart2, ShoppingCart, DollarSign, CreditCard, Download, Calendar, TrendingUp, TrendingDown, Activity, FileText, ArrowRight, RefreshCw, Check, AlertCircle } from 'react-feather';
import { Cpu, Zap } from 'lucide-react';

// Helper for CSV export
function downloadCSV(data, filename) {
    const headers = Object.keys(data);
    const rows = [
        headers.join(','),
        headers.map(h => {
            const val = data[h];
            return typeof val === 'number' ? val.toFixed(2) : `"${val}"`;
        }).join(',')
    ];
    const csvContent = rows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function ReportSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card" style={{ padding: 'var(--space-8)', borderRadius: '24px' }}>
                        <div className="skeleton skeleton-text-sm" style={{ marginBottom: 'var(--space-4)', width: '40%' }} />
                        <div className="skeleton skeleton-title" style={{ width: '70%', height: '40px' }} />
                        <div className="skeleton skeleton-text-sm" style={{ width: '30%', marginTop: 'var(--space-4)' }} />
                    </div>
                ))}
            </div>
            <div className="card" style={{ padding: 'var(--space-8)', borderRadius: '24px' }}>
                <div className="skeleton skeleton-title" style={{ marginBottom: 'var(--space-6)', width: '30%' }} />
                <div style={{ height: '300px', background: 'var(--color-bg)', borderRadius: '16px', marginBottom: 'var(--space-6)' }} className="skeleton" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton skeleton-text" style={{ marginBottom: 'var(--space-4)' }} />
                ))}
            </div>
        </div>
    );
}

const TABS = [
    { id: 'general', label: 'Ümumi Analiz', icon: <Activity size={18} /> },
    { id: 'sales', label: 'Satış Hesabatları', icon: <ShoppingCart size={18} /> },
    { id: 'expenses', label: 'Xərc Hesabatları', icon: <DollarSign size={18} /> },
    { id: 'debts', label: 'Borc & Kredit', icon: <CreditCard size={18} /> }
];

export default function ReportsPage() {
    const { business } = useAuth();
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [auditLoading, setAuditLoading] = useState(false);
    const [error, setError] = useState(null);

    const [dateRange, setDateRange] = useState(() => {
        const start = new Date();
        start.setDate(1);
        const end = new Date();
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    });

    const [reportData, setReportData] = useState(null);

    const [salesData, setSalesData] = useState(null);
    const [expenseData, setExpenseData] = useState(null);
    const [debtData, setDebtData] = useState(null);

    useEffect(() => {
        if (!business) return;
        if (activeTab === 'general') loadGeneralReport();
        if (activeTab === 'sales') loadSalesPerformance();
        if (activeTab === 'expenses') loadExpensesAnalysis();
        if (activeTab === 'debts') loadDebtAnalysis();
    }, [business, dateRange, activeTab]);

    async function loadGeneralReport() {
        try {
            setLoading(true); setError(null);
            const endOfDay = `${dateRange.end}T23:59:59.999Z`;
            const startOfDay = `${dateRange.start}T00:00:00.000Z`;
            const data = await reportsService.getGeneralReport(business.id, startOfDay, endOfDay);
            setReportData(data);
        } catch (err) {
            setError('Hesabat yüklənərkən xəta baş verdi');
        } finally { setLoading(false); }
    }

    async function loadSalesPerformance() {
        try {
            setLoading(true);
            const endOfDay = `${dateRange.end}T23:59:59.999Z`;
            const startOfDay = `${dateRange.start}T00:00:00.000Z`;
            const data = await reportsService.getSalesPerformance(business.id, startOfDay, endOfDay);
            setSalesData(data);
        } catch (err) {
            setError('Satış hesabatı yüklənmədi');
        } finally { setLoading(false); }
    }

    async function loadExpensesAnalysis() {
        try {
            setLoading(true);
            const data = await reportsService.getExpensesAnalysis(business.id, dateRange.start, dateRange.end);
            setExpenseData(data);
        } catch (err) {
            setError('Xərc analizi yüklənmədi');
        } finally { setLoading(false); }
    }

    async function loadDebtAnalysis() {
        try {
            setLoading(true);
            const data = await reportsService.getDebtAnalysis(business.id);
            setDebtData(data);
        } catch (err) {
            setError('Borc analizi yüklənmədi');
        } finally { setLoading(false); }
    }

    async function handleAiAudit() {
        if (!business) return;
        try {
            setAuditLoading(true);
            showSuccess('Aİ analizi başladı, bitəndə "Məktublarım" bölməsinə düşəcək...');

            // Gather all relevant data for the prompt
            const [salesRes, expRes, debtRes] = await Promise.all([
                reportsService.getSalesPerformance(business.id, dateRange.start, dateRange.end),
                reportsService.getExpensesAnalysis(business.id, dateRange.start, dateRange.end),
                reportsService.getDebtAnalysis(business.id)
            ]);

            const prompt = `Sən Siam AI-ın Baş Biznes Auditorusan. Aşağıdakı dataya əsasən ən azı 30 cümlədən ibarət, olduqca dərin, detallı və peşəkar maliyyə analizi/audit məktubu yaz.
            Hər paraqrafda və ya müraciətdə hörmətlə "Müəllim" ifadəsini işlət. 
            Məktubu "answer" sahəsində qaytar.
            Data:
            Satışlar: Top məhsullar ${salesRes.topProducts.map(p => p.name).join(', ')}, Orta satış ₼${salesRes.averageTicketSize}.
            Xərclər: Cəmi ₼${expRes.totalExpenses}.
            Borclar: Cəmi debitor borcu ₼${debtRes.totalReceivable}, Riskli borcların sayı ${debtRes.highRiskDebtorsCount}.
            Məktub sahibkar üçün fərdi, həm tənqidi həm də yol göstərən bir tonla, rəqəmsal transformasiyanın əhəmiyyətini vurğulayaraq yazılmalıdır.`;

            const aiResponse = await aiService.askAssistant(prompt, business.id);
            console.log('AI Audit Response:', aiResponse);

            const content = aiResponse.answer || aiResponse.reply || aiResponse.text || aiResponse.result || (aiResponse.error ? `Xəta: ${aiResponse.error}` : "Aİ-dən boş cavab gəldi.");

            await messagesService.createMessage(
                business.id,
                `${new Date().toLocaleDateString('az-AZ')} - Biznes Audit Hesabatı`,
                content,
                'audit'
            );

            showSuccess('Analiz hazırdır! "Məktublarım" bölməsinə keçid edin.');
        } catch (err) {
            console.error('Audit error:', err);
            showError('Aİ xətası: ' + (err.message || 'Bilinməyən xəta'));
        } finally {
            setAuditLoading(false);
        }
    }

    function handleExport() {
        if (!reportData && activeTab === 'general') return;
        // Simplified export for the current view
        const exportData = activeTab === 'general' ? {
            'Dövr': `${dateRange.start} - ${dateRange.end}`,
            'Satışlar': reportData.totalSales,
            'Mənfəət': reportData.netProfit
        } : { 'Status': 'Yalnız Ümumi Hesabat aktivdir' };

        downloadCSV(exportData, `siam_report_${activeTab}.csv`);
        showSuccess('Hesabat ixrac edildi');
    }

    const renderSalesTab = () => {
        if (!salesData) return <ReportSkeleton />;
        return (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', fontWeight: '600', marginBottom: '8px' }}>ORTALAMA SATIŞ</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₼{salesData.averageTicketSize.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} /> Hər müştəri başına gəlir
                        </div>
                    </div>
                </div>

                <div className="grid-cols-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ marginBottom: '24px', fontWeight: 'bold' }}>Ən Çox Satılan Məhsullar</h3>
                        <div className="table-container" style={{ border: 'none' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Məhsul</th>
                                        <th>Miqdar</th>
                                        <th>Cəmi Gəlir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesData.topProducts.map((p, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: '600' }}>{p.name}</td>
                                            <td>{p.quantity}</td>
                                            <td style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>₼{p.revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Cpu size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px', opacity: auditLoading ? 0.3 : 0.8 }} className={auditLoading ? 'pulse' : ''} />
                            <h3 style={{ marginBottom: '16px' }}>Aİ Biznes Auditi</h3>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                Bütün satış, xərc və borc datalarınızı süni intellektlə analiz edin.
                                Sistem sizə xüsusi audit məktubu hazırlayacaq.
                            </p>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '24px', width: '100%', gap: '8px' }}
                                onClick={handleAiAudit}
                                disabled={auditLoading}
                            >
                                {auditLoading ? <div className="spinner spinner-sm"></div> : 'Analiz et'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderExpensesTab = () => {
        if (!expenseData) return <ReportSkeleton />;
        return (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {expenseData.categories.map((c, i) => (
                        <div key={i} className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>{c.category}</span>
                                <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>₼{c.amount.toFixed(2)}</span>
                            </div>
                            <div style={{ marginTop: '12px', height: '6px', background: 'var(--color-bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${(c.amount / expenseData.totalExpenses) * 100}%`, height: '100%', background: 'var(--color-danger)' }}></div>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                Ümumi xərcin {((c.amount / expenseData.totalExpenses) * 100).toFixed(1)}% hissəsi
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDebtTab = () => {
        if (!debtData) return <ReportSkeleton />;
        return (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>Ən Çox Borcu Olanlar</h3>
                            <span className="badge badge-danger">Cəmi: ₼{debtData.totalReceivable.toFixed(2)}</span>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Müştəri</th>
                                        <th>Borc Məbləği</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debtData.topDebtors.map((d, i) => (
                                        <tr key={i}>
                                            <td>{d.first_name} {d.last_name}</td>
                                            <td style={{ fontWeight: 'bold' }}>₼{d.total_debt.toFixed(2)}</td>
                                            <td>
                                                <span className="badge badge-warning">Gözləyir</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)', marginBottom: '16px' }}>
                            <AlertCircle size={24} />
                            <h3 style={{ margin: 0 }}>Risk Hesabatı</h3>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                            Sistemdə <strong>{debtData.highRiskDebtorsCount}</strong> müştəri son 30 gün ərzində ödəniş etməyib.
                            Bu riskli borcların ümumi həcmi:
                        </p>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-danger)', marginBottom: '32px' }}>
                            ₼{debtData.highRiskAmount.toFixed(2)}
                        </div>
                        <button className="btn btn-outline btn-danger" style={{ width: '100%' }}>Xatırlatma Göndər</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: 'var(--space-8) var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Header Section */}
            <div className="animate-fade-in-up" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: '24px', padding: 'var(--space-2) 0'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--color-primary), #4338ca)', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                            <BarChart2 size={24} />
                        </div>
                        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>Hesabatlar</h1>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Biznesinizin maliyyə göstəricilərini izləyin və analiz edin</p>
                </div>

                <div style={{
                    display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.01)', backdropFilter: 'blur(10px)', padding: '12px 24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)'
                }}>
                    <Calendar size={18} color="var(--color-primary)" />
                    <input type="date" className="input-minimal" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ border: 'none', background: 'transparent', fontWeight: '700', color: 'var(--color-text)', fontSize: '14px', cursor: 'pointer' }} />
                    <ArrowRight size={14} color="var(--color-text-tertiary)" />
                    <input type="date" className="input-minimal" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ border: 'none', background: 'transparent', fontWeight: '700', color: 'var(--color-text)', fontSize: '14px', cursor: 'pointer' }} />
                    <div style={{ width: '1px', height: '28px', background: 'var(--color-border-light)' }}></div>
                    <button className="btn btn-ghost btn-sm btn-animate" onClick={handleExport} disabled={loading} style={{ gap: '8px', padding: '8px 16px' }}><Download size={16} /> İxrac</button>
                </div>
            </div>

            {/* Premium Tab Navigation */}
            <div className="animate-fade-in-up stagger-1" style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="btn-animate"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '14px', border: 'none',
                            background: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                            color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                            fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                            boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="glass-card animate-fade-in" style={{ borderLeft: '4px solid var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)', marginBottom: '32px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertCircle size={20} color="var(--color-danger)" />
                        <div><h4 style={{ margin: '0 0 4px 0', color: 'var(--color-danger)' }}>Xəta</h4><p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>{error}</p></div>
                    </div>
                </div>
            )}

            {loading ? <ReportSkeleton /> : (
                <>
                    {activeTab === 'general' && reportData && (
                        <div className="animate-fade-in-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div className="grid-cols-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                <div className="glass-card" style={{ padding: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>ÜMUMİ SATIŞLAR</div>
                                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₼{reportData.totalSales.toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', padding: '12px', borderRadius: '16px' }}><TrendingUp size={24} /></div>
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>ÜMUMİ XƏRCLƏR</div>
                                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₼{reportData.totalExpenses.toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '12px', borderRadius: '16px' }}><TrendingDown size={24} /></div>
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: '32px', background: 'var(--color-primary)', color: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ opacity: 0.8, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>XALİS MƏNFƏƏT</div>
                                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₼{reportData.netProfit.toLocaleString()}</div>
                                        </div>
                                        <Activity size={24} />
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                            <Cpu size={32} style={{ color: 'var(--color-primary)' }} className={auditLoading ? 'pulse' : ''} />
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', borderRadius: '12px' }}
                                            onClick={handleAiAudit}
                                            disabled={auditLoading}
                                        >
                                            {auditLoading ? <div className="spinner spinner-sm"></div> : 'Analiz et'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'sales' && renderSalesTab()}
                    {activeTab === 'expenses' && renderExpensesTab()}
                    {activeTab === 'debts' && renderDebtTab()}
                </>
            )}
        </div>
    );
}
