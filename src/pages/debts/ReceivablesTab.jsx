import { useState, useEffect } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import KPICard from '../../components/dashboard/KPICard';
import { debtsService } from '../../services/debts.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { User, Phone, DollarSign, Calendar, TrendingDown, TrendingUp, CheckCircle, Info, X, Search, ChevronDown, ChevronUp, PlusCircle } from 'react-feather';

export default function ReceivablesTab() {
    const { business, user } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const navigate = useNavigate();

    // We reuse useCustomers to list people
    const { customers, loading, refreshCustomers, filters, setFilters } = useCustomers({ status: 'borclu' });

    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'cash', notes: '' });
    const [paying, setPaying] = useState(false);

    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const [debtData, setDebtData] = useState({ amount: '', notes: '' });
    const [recordingDebt, setRecordingDebt] = useState(false);

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const [expandedCustomers, setExpandedCustomers] = useState(new Set());
    const [customerTransactions, setCustomerTransactions] = useState({}); // { customerId: transactions[] }
    const [txLoadingMap, setTxLoadingMap] = useState({}); // { customerId: boolean }

    const toggleExpand = async (customerId) => {
        const newExpanded = new Set(expandedCustomers);
        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
            if (!customerTransactions[customerId]) {
                await loadCustomerTransactions(customerId);
            }
        }
        setExpandedCustomers(newExpanded);
    };

    async function loadCustomerTransactions(customerId) {
        setTxLoadingMap(prev => ({ ...prev, [customerId]: true }));
        try {
            const data = await debtsService.getTransactions(business.id, customerId, 'customer');
            setCustomerTransactions(prev => ({ ...prev, [customerId]: data }));
        } catch (err) {
            console.error(err);
        } finally {
            setTxLoadingMap(prev => ({ ...prev, [customerId]: false }));
        }
    }

    async function handleRecordPayment(e) {
        e.preventDefault();
        if (!paymentData.amount || Number(paymentData.amount) <= 0) return showError('Məbləğ düzgün deyil.');
        const cid = selectedCustomerId;

        try {
            setPaying(true);
            await debtsService.recordPayment({
                businessId: business.id,
                customerId: cid,
                amount: Number(paymentData.amount),
                paymentMethod: paymentData.method,
                userId: user.id,
                notes: paymentData.notes
            });
            showSuccess('Ödəniş uğurla qeydə alındı');
            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '', method: 'cash', notes: '' });
            refreshCustomers();
            loadCustomerTransactions(cid);
        } catch (err) {
            showError(err.message);
        } finally {
            setPaying(false);
        }
    }

    async function handleRecordDebt(e) {
        e.preventDefault();
        if (!debtData.amount || Number(debtData.amount) <= 0) return showError('Məbləğ düzgün deyil.');
        const cid = selectedCustomerId;

        try {
            setRecordingDebt(true);
            await debtsService.recordDebtIncrease({
                businessId: business.id,
                customerId: cid,
                amount: Number(debtData.amount),
                userId: user.id,
                notes: debtData.notes
            });
            showSuccess('Borc uğurla əlavə edildi');
            setIsDebtModalOpen(false);
            setDebtData({ amount: '', notes: '' });
            refreshCustomers();
            loadCustomerTransactions(cid);
        } catch (err) {
            showError(err.message);
        } finally {
            setRecordingDebt(false);
        }
    }

    const txColumns = [
        {
            header: 'Tarix',
            field: 'created_at',
            render: (row) => (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    {new Date(row.created_at).toLocaleString('az-AZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
            )
        },
        {
            header: 'Növ',
            field: 'transaction_type',
            render: (row) => row.transaction_type === 'debt_payment'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: '700', fontSize: 'var(--font-sm)' }}>
                    <TrendingDown size={14} /> Ödəniş
                </div>
                : <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontWeight: '700', fontSize: 'var(--font-sm)' }}>
                    <TrendingUp size={14} /> Borc Artımı
                </div>
        },
        {
            header: 'Məbləğ',
            field: 'amount',
            render: (row) => <span style={{ fontWeight: '600' }}>₼{Number(row.amount).toFixed(2)}</span>
        },
        {
            header: 'Qalıq',
            field: 'balance_after',
            render: (row) => <span style={{ color: 'var(--color-text-secondary)' }}>₼{Number(row.balance_after).toFixed(2)}</span>
        },
        {
            header: 'Qeyd',
            field: 'notes',
            render: (row) => <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>{row.notes || '-'}</span>
        }
    ];

    const totalReceivable = customers.reduce((sum, c) => sum + Number(c.total_debt), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            <div className="grid-cols-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <KPICard
                    title="Toplam Alacaq Məbləği"
                    value={totalReceivable}
                    icon={<DollarSign size={20} />}
                    color="danger"
                    loading={loading}
                    className="glass-card"
                />
                <KPICard
                    title="Borclu Müştəri Sayı"
                    value={customers.filter(c => Number(c.total_debt) > 0).length}
                    format="number"
                    icon={<User size={20} />}
                    color="primary"
                    loading={loading}
                    className="glass-card"
                />
            </div>

            {/* Search and Filters Header */}
            <div className="card glass-card debts-header" style={{ padding: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="debts-search-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Müştəri axtar..."
                            value={filters.search || ''}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                            style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px' }}
                        />
                    </div>
                </div>
                <div className="debts-filter-wrap" style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn btn-sm btn-animate ${filters.status === 'borclu' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setFilters({ ...filters, status: 'borclu' })}
                        style={{ height: '40px', padding: '0 20px' }}
                    >
                        Yalnız Borclular
                    </button>
                    <button
                        className={`btn btn-sm btn-animate ${filters.status === 'all' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setFilters({ ...filters, status: 'all' })}
                        style={{ height: '40px', padding: '0 20px' }}
                    >
                        Bütün Müştərilər
                    </button>
                    <button className="btn btn-approve btn-animate" onClick={() => navigate('/customers')} style={{ gap: '8px', height: '40px' }}>
                        <PlusCircle size={18} /> Yeni Müştəri
                    </button>
                </div>
            </div>

            {/* Main Content: Single Column Accordion List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {loading ? (
                    <div className="skeleton-line" style={{ height: '400px', borderRadius: '20px' }} />
                ) : customers.length === 0 ? (
                    <div className="empty-state card" style={{ padding: '64px' }}>
                        <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>Borclu Müştəri Tapılmadı</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Bütün hesablar hazırda qaydasındadır.</p>
                    </div>
                ) : (
                    customers.map(c => {
                        const isExpanded = expandedCustomers.has(c.id);
                        const txs = customerTransactions[c.id] || [];
                        const isTxLoading = txLoadingMap[c.id];

                        return (
                            <div key={c.id} className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', border: isExpanded ? '1px solid var(--color-primary-ghost)' : '1px solid var(--color-border-light)', transition: 'all 0.3s ease' }}>
                                {/* Row Header */}
                                <div
                                    className="debt-row-header"
                                    onClick={() => toggleExpand(c.id)}
                                    style={{
                                        padding: '20px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        background: isExpanded ? 'rgba(79, 70, 229, 0.02)' : 'white'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div className="avatar" style={{
                                            width: '48px',
                                            height: '48px',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            background: Number(c.total_debt) > 0 ? 'var(--color-danger-ghost)' : 'var(--color-bg)',
                                            color: Number(c.total_debt) > 0 ? 'var(--color-danger)' : 'var(--color-text-tertiary)'
                                        }}>
                                            {c.first_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '18px' }}>{c.first_name} {c.last_name || ''}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> {c.phone || 'Nömrəsiz'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="debt-amount-container" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Toplam Borc
                                            </div>
                                            <div style={{ fontSize: '22px', fontWeight: '900', color: Number(c.total_debt) > 0 ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
                                                ₼{Number(c.total_debt).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="debt-actions-mobile" style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                            <button
                                                className="btn btn-outline btn-sm btn-animate"
                                                onClick={() => {
                                                    setSelectedCustomerId(c.id);
                                                    setIsDebtModalOpen(true);
                                                }}
                                                style={{ height: '40px', padding: '0 16px', borderRadius: '10px' }}
                                            >
                                                <TrendingUp size={16} /> Borc
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm btn-animate"
                                                onClick={() => {
                                                    setSelectedCustomerId(c.id);
                                                    setIsPaymentModalOpen(true);
                                                }}
                                                style={{ height: '40px', padding: '0 16px', borderRadius: '10px' }}
                                            >
                                                <DollarSign size={16} /> Ödəniş
                                            </button>
                                        </div>

                                        <div style={{ color: 'var(--color-text-tertiary)', marginLeft: '8px' }}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Transaction History */}
                                {isExpanded && (
                                    <div style={{ borderTop: '1px solid var(--color-border-light)', background: '#fcfcfd', padding: '12px 24px 24px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px 0' }}>
                                            <Info size={14} className="text-tertiary" />
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Tranzaksiya Tarixçəsi</span>
                                        </div>

                                        {isTxLoading ? (
                                            <div className="skeleton-line" style={{ height: '150px' }} />
                                        ) : txs.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '14px', fontStyle: 'italic' }}>
                                                Heç bir hərəkət qeydə alınmayıb.
                                            </div>
                                        ) : (
                                            <div style={{ borderRadius: '12px', border: '1px solid var(--color-border-light)', overflow: 'hidden' }}>
                                                <DataTable
                                                    columns={txColumns}
                                                    data={txs}
                                                    loading={false}
                                                    compact
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Borc Ödənişi Qəbulu"
                maxWidth="560px"
            >
                <div className="animate-fade-in-up">
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-primary-light), rgba(99, 102, 241, 0.05))',
                        padding: '24px',
                        borderRadius: '20px',
                        marginBottom: '24px',
                        border: '1px solid var(--color-primary-ghost)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
                        }}>
                            <User size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Müştəri</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                                {selectedCustomer?.first_name} {selectedCustomer?.last_name}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <Phone size={12} /> {selectedCustomer?.phone || '-'}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="form-group stagger-1">
                            <label style={{ fontWeight: '700', color: 'var(--color-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Ödənilən Məbləğ (₼)</span>
                                <span style={{ fontSize: '12px', color: 'var(--color-danger)', background: 'var(--color-danger-light)', padding: '2px 8px', borderRadius: '6px' }}>
                                    Qalıq: ₼{Number(selectedCustomer?.total_debt).toFixed(2)}
                                </span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', zIndex: 1 }} />
                                <input
                                    type="number"
                                    className="input"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    max={selectedCustomer ? Number(selectedCustomer.total_debt) : undefined}
                                    value={paymentData.amount}
                                    onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: '800',
                                        paddingLeft: '48px',
                                        height: '72px',
                                        borderRadius: '20px',
                                        background: 'var(--color-bg)',
                                        border: '2px solid var(--color-border)',
                                        color: 'var(--color-primary-dark)'
                                    }}
                                    autoFocus
                                />
                            </div>

                            {/* Quick Select Chips */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                {[0.25, 0.5, 1].map(ratio => {
                                    const amount = (Number(selectedCustomer?.total_debt || 0) * ratio).toFixed(2);
                                    return (
                                        <button
                                            key={ratio}
                                            type="button"
                                            className="btn-animate"
                                            onClick={() => setPaymentData({ ...paymentData, amount })}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--color-border)',
                                                background: 'white',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                color: 'var(--color-text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {ratio === 1 ? 'Tamamını ödə' : `%${ratio * 100}`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="stagger-2">
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Ödəniş Metodu</label>
                                <select className="input" value={paymentData.method} onChange={e => setPaymentData({ ...paymentData, method: e.target.value })} style={{ height: '52px', borderRadius: '14px' }}>
                                    <option value="cash">💵 Nəğd</option>
                                    <option value="card">💳 Kart</option>
                                    <option value="bank_transfer">🏦 Köçürmə</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Tarix</label>
                                <div style={{ height: '52px', borderRadius: '14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                    {new Date().toLocaleDateString('az-AZ')}
                                </div>
                            </div>
                        </div>

                        <div className="form-group stagger-3">
                            <label style={{ fontSize: '13px', fontWeight: '600' }}>Qeyd (Daha çox detallar üçün)</label>
                            <textarea
                                className="input"
                                rows="3"
                                placeholder="Məs. 'Müştəri hissə-hissə ödəyəcəyini bildirdi'..."
                                value={paymentData.notes}
                                onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                                style={{ borderRadius: '16px', padding: '16px' }}
                            ></textarea>
                        </div>

                        <div className="stagger-4" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="button" className="btn btn-outline btn-lg btn-animate" onClick={() => setIsPaymentModalOpen(false)} style={{ flex: 1, borderRadius: '16px' }}>Ləğv et</button>
                            <button type="submit" className="btn btn-primary btn-lg btn-animate" disabled={paying || !paymentData.amount} style={{ flex: 2, borderRadius: '16px', gap: '10px', fontSize: '18px' }}>
                                {paying ? <div className="spinner"></div> : <><CheckCircle size={22} /> Ödənişi Tamamla</>}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Manual Debt Increase Modal */}
            <Modal
                isOpen={isDebtModalOpen}
                onClose={() => setIsDebtModalOpen(false)}
                title="Yeni Borc Əlavə Et"
                maxWidth="500px"
            >
                <div className="animate-fade-in-up">
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--color-danger)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0 }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700' }}>{selectedCustomer?.first_name} {selectedCustomer?.last_name || ''}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Müştəriyə əlavə borc məbləği təyin ediləcək.</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleRecordDebt} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: '600' }}>Borc Məbləği (₼)</label>
                            <input
                                type="number"
                                className="input"
                                required
                                min="0.01"
                                step="0.01"
                                value={debtData.amount}
                                onChange={e => setDebtData({ ...debtData, amount: e.target.value })}
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: '600' }}>Səbəb / Qeyd</label>
                            <textarea
                                className="input"
                                rows="3"
                                value={debtData.notes}
                                onChange={e => setDebtData({ ...debtData, notes: e.target.value })}
                                placeholder="Məs. 'Xidmət haqqı', 'Nisyə mal satışı'..."
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                            <button type="button" className="btn btn-outline btn-lg btn-animate" onClick={() => setIsDebtModalOpen(false)} style={{ flex: 1 }}>Ləğv et</button>
                            <button type="submit" className="btn btn-danger btn-lg btn-animate" disabled={recordingDebt || !debtData.amount} style={{ flex: 2 }}>
                                {recordingDebt ? <div className="spinner"></div> : 'Borcu Qeydə Al'}
                            </button>
                        </div>
                        <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid var(--color-border-light)', paddingTop: '16px' }}>
                            <button
                                type="button"
                                className="btn btn-link btn-animate"
                                onClick={() => navigate('/customers')}
                                style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}
                            >
                                <PlusCircle size={14} style={{ marginRight: '6px' }} /> Yeni Müştəri Əlavə Et
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
