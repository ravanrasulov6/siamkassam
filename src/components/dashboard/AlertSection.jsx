import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { expensesService } from '../../services/expenses.service';
import { payablesService } from '../../services/payables.service';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, Clock, Check, Calendar, ChevronRight, Activity, X, Bookmark } from 'react-feather';

export default function AlertSection() {
    const { business } = useAuth();
    const { showSuccess, showError } = useToast();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [postponeMenuId, setPostponeMenuId] = useState(null);
    const dateInputRef = useRef(null);

    const fetchAlerts = useCallback(async () => {
        if (!business?.id) return;
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const todayDay = now.getDate();

            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            const dateLimit = threeDaysFromNow.toISOString().split('T')[0];

            // Fetch upcoming pending expenses
            const { data: expenses, error: expError } = await supabase
                .from('expenses')
                .select('*')
                .eq('business_id', business.id)
                .eq('status', 'pending')
                .lte('expense_date', dateLimit);

            // Fetch upcoming active payables
            const { data: payables, error: payError } = await supabase
                .from('payables')
                .select('*')
                .eq('business_id', business.id)
                .eq('status', 'active')
                .lte('due_date', dateLimit);

            // Fetch active schedules (templates with due_day)
            const { data: templates, error: tplError } = await supabase
                .from('expense_templates')
                .select('*')
                .eq('business_id', business.id)
                .not('due_day', 'is', null);

            // Fetch recorded expenses for current and previous month to be safe
            const twoMonthsAgo = new Date(year, month - 1, 1).toISOString();
            const { data: recentExpenses } = await supabase
                .from('expenses')
                .select('category, expense_date')
                .eq('business_id', business.id)
                .gte('expense_date', twoMonthsAgo);

            // Group expenses by category and month (key: category-YYYY-MM)
            const paidMap = new Set();
            recentExpenses?.forEach(exp => {
                const date = new Date(exp.expense_date);
                const key = `${exp.category.toLowerCase().trim()}-${date.getFullYear()}-${date.getMonth()}`;
                paidMap.add(key);
            });

            if (expError) throw expError;
            if (payError) throw payError;
            if (tplError) throw tplError;

            const templateAlerts = [];
            (templates || []).forEach(t => {
                const catLower = t.category.toLowerCase().trim();

                // 1. Check current month
                const currentMonthDue = new Date(year, month, t.due_day);
                const isPaidThisMonth = paidMap.has(`${catLower}-${year}-${month}`);

                // Show if NOT paid AND (it's overdue OR it's coming in 3 days)
                const daysToCurrent = (currentMonthDue - now) / (1000 * 60 * 60 * 24);
                if (!isPaidThisMonth && daysToCurrent <= 3) {
                    templateAlerts.push({
                        id: `tpl-cur-${t.id}`,
                        template_id: t.id,
                        type: 'template',
                        title: t.category,
                        amount: t.amount,
                        date: currentMonthDue.toISOString().split('T')[0],
                        notes: daysToCurrent < 0 ? 'Gecikmiş Aylıq Ödəniş' : 'Aylıq planlaşdırılmış ödəniş'
                    });
                } else if (isPaidThisMonth) {
                    // If paid this month, check if next month is coming soon (rolling 3 days)
                    const nextMonth = month + 1;
                    const nextYear = year + (nextMonth > 11 ? 1 : 0);
                    const targetNextMonth = nextMonth % 12;

                    const nextMonthDue = new Date(nextYear, targetNextMonth, t.due_day);
                    const isPaidNextMonth = paidMap.has(`${catLower}-${nextYear}-${targetNextMonth}`);

                    const daysToNext = (nextMonthDue - now) / (1000 * 60 * 60 * 24);
                    if (!isPaidNextMonth && daysToNext <= 3) {
                        templateAlerts.push({
                            id: `tpl-next-${t.id}`,
                            template_id: t.id,
                            type: 'template',
                            title: t.category,
                            amount: t.amount,
                            date: nextMonthDue.toISOString().split('T')[0],
                            notes: 'Növbəti ayın ödənişi yaxınlaşır'
                        });
                    }
                }
            });

            const combinedAlerts = [
                ...(expenses || []).map(e => ({
                    id: e.id,
                    type: 'expense',
                    title: e.category,
                    amount: e.amount,
                    date: e.expense_date,
                    notes: e.notes
                })),
                ...(payables || []).map(p => ({
                    id: p.id,
                    type: 'payable',
                    title: p.creditor_name,
                    amount: Number(p.amount) - Number(p.paid_amount || 0),
                    date: p.due_date,
                    notes: p.description
                })),
                ...templateAlerts
            ].sort((a, b) => new Date(a.date) - new Date(b.date));

            setAlerts(combinedAlerts);
        } catch (err) {
            console.error('Alerts Error:', err);
        } finally {
            setLoading(false);
        }
    }, [business?.id]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    async function handlePay(alert) {
        if (actionId) return;
        try {
            setActionId(alert.id);
            if (alert.type === 'expense') {
                await expensesService.update(alert.id, { status: 'paid' });
            } else if (alert.type === 'template') {
                await expensesService.create({
                    business_id: business.id,
                    category: alert.title,
                    amount: alert.amount,
                    expense_date: new Date().toISOString().split('T')[0],
                    status: 'paid',
                    notes: 'Şablondan ödənildi'
                });
            } else {
                await payablesService.recordPayment(alert.id, alert.amount, 0, alert.amount);
            }
            showSuccess('Ödəniş uğurla qeyd edildi');
            fetchAlerts();
        } catch (err) {
            showError(err.message);
        } finally {
            setActionId(null);
        }
    }

    async function handlePostpone(alert, daysOrDate) {
        if (actionId) return;
        try {
            setActionId(alert.id);
            let formattedDate;

            if (typeof daysOrDate === 'number') {
                const newDate = new Date(alert.date);
                newDate.setDate(newDate.getDate() + daysOrDate);
                formattedDate = newDate.toISOString().split('T')[0];
            } else {
                formattedDate = daysOrDate;
            }

            if (alert.type === 'expense') {
                await expensesService.update(alert.id, { expense_date: formattedDate });
            } else if (alert.type === 'template') {
                await expensesService.create({
                    business_id: business.id,
                    category: alert.title,
                    amount: alert.amount,
                    expense_date: formattedDate,
                    status: 'pending',
                    notes: 'Şablondan planlaşdırıldı'
                });
            } else {
                await payablesService.updatePayable(alert.id, { due_date: formattedDate });
            }
            showSuccess('Ödəniş ertələndi');
            setPostponeMenuId(null);
            fetchAlerts();
        } catch (err) {
            showError(err.message);
        } finally {
            setActionId(null);
        }
    }

    if (loading || (alerts.length === 0 && !loading)) {
        if (loading) return <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }} className="skeleton" />;
        return null;
    }

    return (
        <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-danger) 0%, #ff6b81 100%)',
                        padding: '8px',
                        borderRadius: '10px',
                        display: 'flex',
                        boxShadow: '0 4px 12px rgba(255, 71, 87, 0.2)'
                    }}>
                        <AlertCircle size={18} style={{ color: 'white' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text)', letterSpacing: '0.08em', margin: 0 }}>
                            Təcili Ödənişlər
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: '2px 0 0 0' }}>Diqqət yetirməli olduğunuz {alerts.length} ödəniş var</p>
                    </div>
                </div>
                <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-5)' }}>
                {alerts.map((alert) => (
                    <div key={alert.id} className="glass-card stagger-item" style={{
                        padding: 'var(--space-5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-5)',
                        border: '1px solid var(--color-border-light)',
                        background: postponeMenuId === alert.id ? 'var(--color-bg-elevated)' : 'rgba(255, 255, 255, 0.01)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative background pulse for templates */}
                        {alert.type === 'template' && (
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--color-primary)', opacity: 0.05, filter: 'blur(40px)', borderRadius: '50%' }} />
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    background: alert.type === 'template' ? 'var(--color-primary-light)' : 'var(--color-danger-light)',
                                    color: alert.type === 'template' ? 'var(--color-primary)' : 'var(--color-danger)',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px solid ${alert.type === 'template' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 71, 87, 0.1)'}`
                                }}>
                                    {alert.type === 'template' ? <Bookmark size={22} /> : <Clock size={22} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: 'var(--font-lg)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{alert.title}</div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: alert.type === 'expense' ? 'rgba(99, 102, 241, 0.1)' : alert.type === 'template' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            color: alert.type === 'expense' ? 'var(--color-primary)' : alert.type === 'template' ? 'var(--color-success)' : 'var(--color-warning)'
                                        }}>
                                            {alert.type === 'expense' ? 'Gözləyən Xərc' : alert.type === 'template' ? 'Təkrarlanan' : 'Borc'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {new Date(alert.date).toLocaleDateString('az-AZ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 'var(--font-xl)', fontWeight: '900', color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginRight: '2px' }}>₼</span>
                                    {Number(alert.amount).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px', fontWeight: '500' }}>
                                    {alert.notes || 'Qeyd yoxdur'}
                                </div>
                            </div>
                        </div>

                        {postponeMenuId === alert.id ? (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--color-bg-elevated)', borderRadius: '20px', border: '1px solid var(--color-border-light)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ertələmə müddəti:</span>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPostponeMenuId(null)}><X size={14} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                    {[1, 3, 5, 7].map(days => (
                                        <button key={days} className="btn btn-outline btn-sm btn-animate" onClick={() => handlePostpone(alert, days)} style={{ fontSize: '11px', padding: '10px 0', borderRadius: '12px', background: 'var(--color-surface)' }}>
                                            {days} gün
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', flexShrink: 0, fontWeight: '600' }}>Və ya fərdi:</label>
                                    <input
                                        type="date"
                                        className="input"
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ height: '36px', fontSize: '12px', padding: '0 12px', borderRadius: '10px', background: 'var(--color-surface)' }}
                                        onChange={(e) => handlePostpone(alert, e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    className="btn btn-primary btn-animate"
                                    onClick={() => handlePay(alert)}
                                    disabled={actionId !== null}
                                    style={{
                                        flex: 2,
                                        gap: '10px',
                                        height: '48px',
                                        borderRadius: '16px',
                                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.15)',
                                        fontSize: 'var(--font-sm)',
                                        fontWeight: '700'
                                    }}
                                >
                                    {actionId === alert.id ? <Activity className="spin" size={18} /> : <><Check size={18} /> İndi Ödə</>}
                                </button>
                                <button
                                    className="btn btn-outline btn-animate"
                                    onClick={() => setPostponeMenuId(alert.id)}
                                    disabled={actionId !== null}
                                    style={{
                                        flex: 1,
                                        gap: '10px',
                                        height: '48px',
                                        borderRadius: '16px',
                                        background: 'var(--color-surface)',
                                        fontSize: 'var(--font-sm)',
                                        fontWeight: '700'
                                    }}
                                >
                                    <Clock size={18} /> Ertələ
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
