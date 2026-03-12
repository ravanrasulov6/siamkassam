import { useState } from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import { useExpenseTemplates } from '../../hooks/useExpenseTemplates';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import KPICard from '../../components/dashboard/KPICard';
import { expensesService } from '../../services/expenses.service';
import { expenseTemplatesService } from '../../services/expenseTemplates.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AlertSection from '../../components/dashboard/AlertSection';
import { Trash2, Plus, Search, Calendar, FileText, Check, Clock, Bookmark, ChevronRight, Filter, Settings, Edit2 } from 'react-feather';

export default function ExpensesPage() {
    const { business, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const { expenses, loading, filters, setFilters, refreshExpenses } = useExpenses();
    const { templates, loading: templatesLoading, refreshTemplates } = useExpenseTemplates();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState(null);

    const [formData, setFormData] = useState({
        category: 'Digər',
        amount: '',
        payment_method: 'cash',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'paid'
    });

    const [templateFormData, setTemplateFormData] = useState({
        category: 'Digər',
        amount: '',
        notes: '',
        icon: 'Bookmark'
    });

    // Stats calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidTotal = (expenses || [])
        .filter(e => e.status === 'paid' && new Date(e.expense_date) >= startOfMonth)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const pendingTotal = (expenses || [])
        .filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    function handleOpenModal(template = null) {
        setFormData({
            category: template?.category || 'Digər',
            amount: template?.amount || '',
            payment_method: 'cash',
            expense_date: new Date().toISOString().split('T')[0],
            notes: template?.notes || '',
            status: template ? 'pending' : 'paid'
        });
        setIsModalOpen(true);
    }

    async function handleSaveExpense(e) {
        e.preventDefault();
        try {
            setSaving(true);
            await expensesService.create({
                ...formData,
                amount: Number(formData.amount),
                business_id: business.id,
                created_by: user.id
            });
            showSuccess('Xərc uğurla qeyd edildi');
            setIsModalOpen(false);
            refreshExpenses();
        } catch (err) {
            showError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function handleOpenTemplateModal(template = null) {
        setTemplateToEdit(template);
        setTemplateFormData({
            category: template?.category || 'Digər',
            amount: template?.amount || '',
            notes: template?.notes || '',
            icon: template?.icon || 'Bookmark',
            due_day: template?.due_day || ''
        });
        setIsTemplateModalOpen(true);
    }

    async function handleSaveTemplate(e) {
        e.preventDefault();
        try {
            setSaving(true);
            const data = {
                ...templateFormData,
                due_day: templateFormData.due_day ? Number(templateFormData.due_day) : null
            };

            if (templateToEdit) {
                await expenseTemplatesService.update(templateToEdit.id, data);
                showSuccess('Şablon yeniləndi');
            } else {
                await expenseTemplatesService.create({
                    ...data,
                    business_id: business.id
                });
                showSuccess('Yeni şablon yaradıldı');
            }
            setIsTemplateModalOpen(false);
            refreshTemplates();
        } catch (err) {
            showError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteTemplate(id) {
        if (!window.confirm('Bu şablonu silmək istədiyinizə əminsiniz?')) return;
        try {
            await expenseTemplatesService.delete(id);
            showSuccess('Şablon silindi');
            refreshTemplates();
        } catch (err) {
            showError(err.message);
        }
    }

    async function handleStatusToggle(id, currentStatus) {
        try {
            await expensesService.toggleStatus(id, currentStatus);
            showSuccess('Status yeniləndi');
            refreshExpenses();
        } catch (err) {
            showError(err.message);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Bu xərc qeydini silmək istədiyinizə əminsiniz?')) return;
        try {
            await expensesService.delete(id);
            showSuccess('Xərc qeydi silindi');
            refreshExpenses();
        } catch (err) {
            showError(err.message);
        }
    }

    const categoryColors = {
        'Maaş': 'primary',
        'Kirayə': 'neutral',
        'Kommunal': 'warning',
        'Təchizat': 'success',
        'Vergi': 'danger',
        'Nəqliyyat': 'neutral',
        'Digər': 'neutral'
    };

    const columns = [
        {
            header: 'Tarix',
            field: 'expense_date',
            render: (row) => (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} />
                    {new Date(row.expense_date).toLocaleDateString('az-AZ')}
                </div>
            )
        },
        {
            header: 'Kateqoriya',
            field: 'category',
            render: (row) => <Badge variant={categoryColors[row.category] || 'neutral'}>{row.category}</Badge>
        },
        {
            header: 'Məbləğ',
            field: 'amount',
            render: (row) => <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>₼{Number(row.amount).toFixed(2)}</span>
        },
        {
            header: 'Status',
            field: 'status',
            render: (row) => (
                <select
                    value={row.status}
                    onChange={(e) => handleStatusToggle(row.id, row.status)}
                    className={`badge-select badge-${row.status === 'paid' ? 'success' : 'warning'}`}
                >
                    <option value="paid">Ödənilib</option>
                    <option value="pending">Ödənilməyib</option>
                </select>
            )
        },
        {
            header: 'Qeyd',
            field: 'notes',
            render: (row) => <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>{row.notes || '-'}</span>
        },
        {
            header: 'Əməliyyatlar',
            align: 'right',
            render: (row) => (
                <button className="btn btn-ghost btn-icon btn-animate" onClick={() => handleDelete(row.id)} style={{ color: 'var(--color-danger)' }} title="Sil">
                    <Trash2 size={16} />
                </button>
            )
        }
    ];

    return (
        <div style={{ padding: 'var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: '800', marginBottom: 'var(--space-1)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Xərclər</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-base)' }}>Aylıq planlama və xərclərin idarə edilməsi</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline btn-animate" onClick={() => handleOpenTemplateModal()} style={{ gap: '8px' }}>
                        <Settings size={18} /> Şablonlar
                    </button>
                    <button className="btn btn-primary btn-animate" onClick={() => handleOpenModal()} style={{ gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
                        <Plus size={18} /> Yeni Xərc
                    </button>
                </div>
            </div>

            {/* DYNAMIC PLANNING TEMPLATES */}
            {templates.length > 0 && (
                <div className="animate-fade-in-up stagger-1" style={{ marginBottom: 'var(--space-8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                        <h3 style={{ fontSize: 'var(--font-xs)', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bookmark size={14} style={{ color: 'var(--color-primary)' }} /> Aylıq Sabit Ödənişləriniz
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-elevated)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-border-light)' }}>
                            {templates.length} Aktiv Şablon
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                        {templates.map((tpl) => (
                            <div key={tpl.id} className="glass-card stagger-item" style={{
                                padding: 'var(--space-5)',
                                border: '1px solid var(--color-border-light)',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                hover: { transform: 'translateY(-4px)', boxShadow: 'var(--shadow-xl)' }
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, var(--color-primary-light) 0%, rgba(99, 102, 241, 0.05) 100%)',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        color: 'var(--color-primary)',
                                        display: 'flex',
                                        boxShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.1)'
                                    }}>
                                        <Bookmark size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: 'var(--font-base)', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{tpl.category}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <Calendar size={12} style={{ color: 'var(--color-primary)' }} />
                                            {tpl.due_day ? (
                                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>Hər ayın {tpl.due_day}-i</span>
                                            ) : 'Təkrarlanan'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <div style={{ fontWeight: '900', fontSize: 'var(--font-lg)', color: 'var(--color-text)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                        <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--color-text-tertiary)' }}>₼</span>
                                        {Number(tpl.amount).toFixed(2)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-ghost btn-icon btn-sm btn-animate" onClick={() => handleOpenTemplateModal(tpl)} style={{ width: '28px', height: '28px', background: 'var(--color-bg-elevated)' }}><Edit2 size={13} /></button>
                                        <button className="btn btn-ghost btn-icon btn-sm btn-animate" onClick={() => handleDeleteTemplate(tpl.id)} style={{ width: '28px', height: '28px', color: 'var(--color-danger)', background: 'rgba(255, 71, 87, 0.05)' }}><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AlertSection />

            {/* Top KPI row */}
            <div className="animate-fade-in-up stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <KPICard
                    title="Ödənilən (Bu Ay)"
                    value={`₼${paidTotal.toFixed(2)}`}
                    icon={<Check size={20} />}
                    color="success"
                    loading={loading}
                />
                <KPICard
                    title="Gözləyən (Ödənilməyib)"
                    value={`₼${pendingTotal.toFixed(2)}`}
                    icon={<Clock size={20} />}
                    color="warning"
                    loading={loading}
                />
                <KPICard
                    title="Ümumi Qeydlər"
                    value={expenses.length}
                    icon={<FileText size={20} />}
                    color="neutral"
                    format="number"
                    loading={loading}
                />
            </div>

            {/* Filters Bar */}
            <div className="animate-fade-in-up stagger-3" style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-4) var(--space-6)',
                display: 'flex',
                gap: 'var(--space-4)',
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
                        placeholder="Axtarış..."
                        style={{ paddingLeft: '44px', background: 'var(--color-surface)', height: '44px' }}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Filter size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <select className="input" style={{ width: '180px', height: '44px' }} value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}>
                        <option value="">Bütün Kateqoriyalar</option>
                        {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="input" style={{ width: '150px', height: '44px' }} value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="">Bütün Statuslar</option>
                        <option value="paid">Ödənilib</option>
                        <option value="pending">Ödənilməyib</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="animate-fade-in-up stagger-4" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' }}>
                <DataTable columns={columns} data={expenses} loading={loading} emptyStateText="Xərc qeydə alınmayıb." />
            </div>

            {/* ADD EXPENSE MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.status === 'pending' ? 'Plana Əlavə Et' : 'Yeni Xərc Əlavə Et'}>
                <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                        <label>Kateqoriya</label>
                        <select className="input" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label>Məbləğ (₼) *</label>
                            <input type="number" step="0.01" min="0" className="input" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Tarix *</label>
                            <input type="date" className="input" required value={formData.expense_date} onChange={e => setFormData({ ...formData, expense_date: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ödəniş Statusu</label>
                        <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="paid">Ödənilib (Cash Inflow-dan çıxılır)</option>
                            <option value="pending">Ödənilməyib (Planlaşdırılır)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Qeyd / Açıqlama</label>
                        <textarea className="input" rows="2" placeholder="Məs. Bu ayki işıq pulu" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>

                    <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-outline btn-animate" onClick={() => setIsModalOpen(false)}>Ləğv et</button>
                        <button type="submit" className="btn btn-primary btn-animate" disabled={saving} style={{ gap: '8px' }}>
                            {saving ? 'Gözləyin...' : <><Check size={18} /> Təsdiqlə</>}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* TEMPLATE MANAGEMENT MODAL */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={templateToEdit ? 'Şablonu Yenilə' : 'Yeni Standart Xərc Şablonu'}>
                <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                        <label>Kateqoriya (Arenda, Maaş, Kommunal və s.)</label>
                        <input type="text" className="input" required placeholder="Məs. Arenda" value={templateFormData.category} onChange={e => setTemplateFormData({ ...templateFormData, category: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Standart Məbləğ (₼)</label>
                        <input type="number" step="0.01" min="0" className="input" required value={templateFormData.amount} onChange={e => setTemplateFormData({ ...templateFormData, amount: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Ödəniş Günü (Ayın hansı günü?)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                            {[1, 15, 22, 31].map(d => (
                                <button key={d} type="button" className={`btn btn-sm ${Number(templateFormData.due_day) === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTemplateFormData({ ...templateFormData, due_day: d })} style={{ fontSize: '11px', padding: '6px 0' }}>
                                    {d === 1 ? 'Ayın əvvəli' : d === 31 ? 'Ayın sonu' : `${d}-i`}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            className="input"
                            placeholder="Və ya fərdi gün yazın (1-31)"
                            value={templateFormData.due_day}
                            onChange={e => setTemplateFormData({ ...templateFormData, due_day: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Qeyd</label>
                        <textarea className="input" rows="2" placeholder="Məs. Aylıq sabit ödəniş" value={templateFormData.notes} onChange={e => setTemplateFormData({ ...templateFormData, notes: e.target.value })} />
                    </div>

                    <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-outline btn-animate" onClick={() => setIsTemplateModalOpen(false)}>Ləğv et</button>
                        <button type="submit" className="btn btn-primary btn-animate" disabled={saving} style={{ gap: '8px' }}>
                            {saving ? 'Gözləyin...' : <><Check size={18} /> Yadda saxla</>}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
