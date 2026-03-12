import { useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import KPICard from '../../components/dashboard/KPICard';
import { customersService } from '../../services/customers.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Users, TrendingDown, AlertTriangle, Edit3, Trash2, Plus, CreditCard, Search, X } from 'react-feather';

export default function CustomersPage() {
    const { business } = useAuth();
    const { showSuccess, showError } = useToast();
    const { customers, loading, filters, setFilters, refreshCustomers } = useCustomers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '', email: '', credit_limit: '' });
    const [saving, setSaving] = useState(false);

    // Quick stats
    const totalCustomers = customers.length;
    const totalDebt = customers.reduce((sum, c) => sum + Number(c.total_debt), 0);
    const limitReached = customers.filter(c => Number(c.credit_limit) > 0 && Number(c.total_debt) >= Number(c.credit_limit)).length;

    function handleOpenModal(customer = null) {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                first_name: customer.first_name || '',
                last_name: customer.last_name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                credit_limit: customer.credit_limit || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({ first_name: '', last_name: '', phone: '', email: '', credit_limit: '' });
        }
        setIsModalOpen(true);
    }

    async function handleSaveCustomer(e) {
        e.preventDefault();
        if (!formData.first_name) return showError('Ad mütləqdir');

        try {
            setSaving(true);
            const payload = { ...formData, business_id: business.id };
            if (!payload.credit_limit) payload.credit_limit = 0;

            if (editingCustomer) {
                await customersService.update(editingCustomer.id, payload);
                showSuccess('Müştəri məlumatları yeniləndi');
            } else {
                await customersService.create(payload);
                showSuccess('Yeni müştəri əlavə edildi');
            }
            setIsModalOpen(false);
            refreshCustomers();
        } catch (err) {
            showError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteCustomer(id) {
        if (!window.confirm('Bu müştərini silmək istəyirsiniz? Bütün borc və alış tarixçəsi silinə bilər!')) return;
        try {
            await customersService.delete(id);
            showSuccess('Müştəri silindi');
            refreshCustomers();
        } catch (err) {
            showError(err.message);
        }
    }

    const columns = [
        {
            header: 'Müştəri',
            field: 'name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div className="avatar" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        {row.first_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>{row.first_name} {row.last_name}</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>{row.phone || row.email || 'Əlaqə yoxdur'}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Kredit Limiti',
            field: 'credit_limit',
            render: (row) => Number(row.credit_limit) > 0 ? `₼${Number(row.credit_limit).toFixed(2)}` : 'Limitsiz'
        },
        {
            header: 'Borc',
            field: 'total_debt',
            render: (row) => {
                const debt = Number(row.total_debt);
                const limit = Number(row.credit_limit);
                const color = debt > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)';
                const isWarning = limit > 0 && debt >= limit;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ color, fontWeight: debt > 0 ? '700' : '400' }}>
                            ₼{debt.toFixed(2)}
                        </span>
                        {isWarning && <AlertTriangle size={14} className="text-warning" title="Limitə çatıb" />}
                    </div>
                );
            }
        },
        {
            header: 'Əməliyyatlar',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-icon btn-animate" onClick={() => handleOpenModal(row)} title="Redaktə et">
                        <Edit3 size={16} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-animate" onClick={() => handleDeleteCustomer(row.id)} style={{ color: 'var(--color-danger)' }} title="Sil">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: 'var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: '800', marginBottom: 'var(--space-1)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Müştərilər</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-base)' }}>Müştəri bazası və borc idarəetməsi</p>
                </div>
                <button className="btn btn-primary btn-animate" onClick={() => handleOpenModal()} style={{ gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
                    <Plus size={18} /> Yeni Müştəri
                </button>
            </div>

            {/* KPI Cards */}
            <div className="animate-fade-in-up stagger-1 grid-cols-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <KPICard
                    title="Ümumi Müştəri"
                    value={totalCustomers}
                    icon={<Users size={20} />}
                    color="primary"
                    format="number"
                    loading={loading}
                    className="glass-card"
                />
                <KPICard
                    title="Ümumi Alacaqlar"
                    value={totalDebt}
                    icon={<TrendingDown size={20} />}
                    color="danger"
                    format="currency"
                    loading={loading}
                    className="glass-card"
                />
                <KPICard
                    title="Limitə Çatanlar"
                    value={limitReached}
                    icon={<AlertTriangle size={20} />}
                    color="warning"
                    format="number"
                    loading={loading}
                    className="glass-card"
                />
            </div>

            {/* Filters */}
            <div className="animate-fade-in-up stagger-2 glass-card" style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-4) var(--space-6)',
                display: 'flex',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Ad və ya telefon ilə axtar..."
                        style={{
                            paddingLeft: '44px',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            height: '44px',
                            border: '1px solid var(--color-border)'
                        }}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <select
                    className="input"
                    style={{
                        width: '240px',
                        height: '44px',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                    <option value="">Bütün Müştərilər</option>
                    <option value="borclu">Borcu Olanlar</option>
                </select>
            </div>

            {/* Content */}
            <div className="animate-fade-in-up stagger-3" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
                <DataTable columns={columns} data={customers} loading={loading} emptyStateText="Müştəri tapılmadı." />
            </div>

            {/* Customer Form Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Müştərini Redaktə Et" : "Yeni Müştəri"}>
                <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label>Ad *</label>
                            <input type="text" className="input" required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Soyad</label>
                            <input type="text" className="input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Telefon</label>
                        <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Kredit Limiti (₼) - İxtiyari</label>
                        <input type="number" className="input" min="0" step="10" placeholder="0 = limitsiz" value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: e.target.value })} />
                        <small style={{ color: 'var(--color-text-tertiary)' }}>Müştərinin maksimum borc götürə biləcəyi məbləğ.</small>
                    </div>

                    <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Ləğv et</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Gözləyin...' : 'Yadda Saxla'}</button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}
