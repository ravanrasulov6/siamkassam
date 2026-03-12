import { useState } from 'react';
import { usePayables } from '../../hooks/usePayables';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import KPICard from '../../components/dashboard/KPICard';
import { payablesService } from '../../services/payables.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DollarSign, User, Calendar, AlertCircle, Plus, CheckCircle, Clock, FileText, Check } from 'react-feather';

export default function PayablesTab() {
    const { business } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const { payables, loading, refreshPayables, filters, setFilters } = usePayables();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [addForm, setAddForm] = useState({ creditor_name: '', amount: '', due_date: '', description: '' });
    const [payForm, setPayForm] = useState({ amount: '' });

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await payablesService.createPayable({
                business_id: business.id,
                ...addForm
            });
            showSuccess('Yeni borc qeydə alındı');
            setIsAddModalOpen(false);
            setAddForm({ creditor_name: '', amount: '', due_date: '', description: '' });
            refreshPayables();
        } catch (err) {
            showError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await payablesService.recordPayment(
                selectedPayable.id,
                payForm.amount,
                Number(selectedPayable.paid_amount),
                Number(selectedPayable.amount)
            );
            showSuccess('Ödəniş qeydə alındı');
            setIsPayModalOpen(false);
            setPayForm({ amount: '' });
            setSelectedPayable(null);
            refreshPayables();
        } catch (err) {
            showError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const totalPayableAmount = payables.reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0);

    const columns = [
        {
            header: 'Kreditor',
            field: 'creditor_name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{
                        width: '32px',
                        height: '32px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        {row.creditor_name.charAt(0)}
                    </div>
                    <strong style={{ color: 'var(--color-text)', fontSize: '14px' }}>{row.creditor_name}</strong>
                </div>
            )
        },
        {
            header: 'Məbləğ',
            field: 'amount',
            render: (row) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>₼{Number(row.amount).toFixed(2)}</span>
        },
        {
            header: 'Qalıq Borc',
            field: 'balance',
            render: (row) => {
                const bal = Number(row.amount) - Number(row.paid_amount || 0);
                return <span style={{ color: bal > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '700' }}>₼{bal.toFixed(2)}</span>;
            }
        },
        {
            header: 'Tarixlər',
            field: 'dates',
            render: (row) => (
                <div style={{ fontSize: '11px' }}>
                    <div style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {new Date(row.created_at).toLocaleDateString()}
                    </div>
                    {row.due_date && (
                        <div style={{ color: 'var(--color-warning-dark)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Calendar size={10} /> Son: {new Date(row.due_date).toLocaleDateString()}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Status',
            field: 'status',
            render: (row) => (
                <span className={`badge ${row.status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {row.status === 'completed' ? 'Bitib' : 'Aktiv'}
                </span>
            )
        },
        {
            header: 'Əməliyyat',
            align: 'right',
            render: (row) => row.status !== 'completed' && (
                <button
                    className="btn btn-sm btn-primary btn-animate"
                    onClick={() => {
                        setSelectedPayable(row);
                        setIsPayModalOpen(true);
                    }}
                    style={{ fontSize: 'var(--font-xs)', padding: '4px 12px' }}
                >
                    Ödəniş Et
                </button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            <div className="animate-fade-in-up stagger-1" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)'
            }}>
                <KPICard
                    title="Toplam Borcum"
                    value={`₼${totalPayableAmount.toFixed(2)}`}
                    icon={<AlertCircle size={20} />}
                    color="warning"
                    loading={loading}
                />
                <KPICard
                    title="Aktiv Borclar"
                    value={payables.filter(p => p.status !== 'completed').length}
                    icon={<FileText size={20} />}
                    color="primary"
                    loading={loading}
                />
            </div>

            <div className="animate-fade-in-up stagger-2 debts-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(10px)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: 'var(--space-4)'
            }}>
                <div className="debts-filter-wrap" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {['active', 'completed', 'all'].map(status => (
                        <button
                            key={status}
                            className={`btn btn-sm btn-animate ${filters.status === status ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilters({ status })}
                            style={{
                                padding: '8px 16px',
                                fontSize: 'var(--font-xs)',
                                background: filters.status === status ? 'var(--color-primary)' : 'var(--color-surface)',
                                border: filters.status === status ? 'none' : '1px solid var(--color-border)'
                            }}
                        >
                            {status === 'active' ? 'Aktiv' : status === 'completed' ? 'Ödənilmişlər' : 'Hamısı'}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary btn-animate" onClick={() => setIsAddModalOpen(true)} style={{ gap: '8px', padding: '10px 20px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
                    <Plus size={18} /> Yeni Borc Qeydi
                </button>
            </div>

            <div className="animate-fade-in-up stagger-3" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
                <DataTable
                    columns={columns}
                    data={payables}
                    loading={loading}
                    emptyStateText="Siyahı boşdur. Qeydə alınmış kreditor borcu yoxdur."
                />
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Borc Əlavə Et (Verəcəyim)">
                <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                        <label>Kimə Borclu Olduğunuz (Firma/Şəxs)</label>
                        <input className="input" required placeholder="Təchizatçı və ya şəxs adı" value={addForm.creditor_name} onChange={e => setAddForm({ ...addForm, creditor_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Borcun Məbləği (₼)</label>
                        <input type="number" min="0.01" step="0.01" className="input" required value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Son Ödəniş Tarixi (İxtiyari)</label>
                        <input type="date" className="input" value={addForm.due_date} onChange={e => setAddForm({ ...addForm, due_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Açıqlama</label>
                        <textarea className="input" rows="2" placeholder="Nə üçün borc alınıb..." value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}></textarea>
                    </div>
                    <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-outline btn-animate" onClick={() => setIsAddModalOpen(false)}>Ləğv et</button>
                        <button type="submit" className="btn btn-primary btn-animate" disabled={actionLoading} style={{ gap: '8px' }}>
                            {actionLoading ? 'Gözləyin...' : <><Check size={18} /> Qeyd Et</>}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPayModalOpen} onClose={() => { setIsPayModalOpen(false); setSelectedPayable(null); }} title="Borc Ödənişi Qeydiyyatı">
                {selectedPayable && (
                    <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div className="card" style={{ background: 'var(--color-bg-elevated)', marginBottom: 'var(--space-2)', borderLeft: '4px solid var(--color-primary)' }}>
                            <p style={{ fontSize: 'var(--font-sm)' }}><strong>{selectedPayable.creditor_name}</strong> tərəfə qalıq borcunuz: <strong style={{ color: 'var(--color-danger)' }}>₼{(Number(selectedPayable.amount) - Number(selectedPayable.paid_amount)).toFixed(2)}</strong></p>
                        </div>
                        <div className="form-group">
                            <label>Ödənilən Məbləğ (₼)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                max={(Number(selectedPayable.amount) - Number(selectedPayable.paid_amount)).toFixed(2)}
                                className="input"
                                required
                                value={payForm.amount}
                                onChange={e => setPayForm({ amount: e.target.value })}
                                style={{ fontSize: 'var(--font-xl)', fontWeight: '700' }}
                            />
                        </div>
                        <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
                            <button type="button" className="btn btn-outline btn-animate" onClick={() => { setIsPayModalOpen(false); setSelectedPayable(null); }}>Ləğv et</button>
                            <button type="submit" className="btn btn-primary btn-animate" disabled={actionLoading} style={{ gap: '8px' }}>
                                {actionLoading ? 'Gözləyin...' : <><CheckCircle size={18} /> Ödənişi Təsdiqlə</>}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
