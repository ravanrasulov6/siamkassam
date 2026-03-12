import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X, ArrowRight } from 'react-feather';

export default function CartPanel({ cart, onCheckout }) {
    const { items, removeItem, updateQuantity, subtotal, discountAmount, setDiscountAmount, total, clearCart } = cart;

    const [discountInput, setDiscountInput] = useState(discountAmount.toString());

    const handleDiscountChange = (e) => {
        setDiscountInput(e.target.value);
        const val = Number(e.target.value);
        if (!isNaN(val) && val >= 0) {
            setDiscountAmount(val);
        }
    };

    if (items.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-tertiary)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ width: 64, height: 64, background: 'var(--color-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                    <ShoppingCart size={32} />
                </div>
                <h3 style={{ fontSize: 'var(--font-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Səbət boşdur</h3>
                <p style={{ fontSize: 'var(--font-sm)' }}>Məhsulları əlavə etmək üçün sol tərəfdən seçin</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {/* Header */}
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-elevated)' }}>
                <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <ShoppingCart size={20} className="text-primary" /> Yeni Satış
                    <span style={{ fontSize: 'var(--font-xs)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {items.length}
                    </span>
                </h2>
                <button className="btn btn-ghost btn-icon btn-animate" onClick={clearCart} title="Səbəti təmizlə" style={{ color: 'var(--color-danger)' }}>
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Item List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>{item.name}</h4>
                            <div style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>₼{Number(item.sell_price).toFixed(2)}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="btn-animate"
                                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                ><Minus size={14} /></button>
                                <div style={{ width: 32, textAlign: 'center', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-sm)' }}>
                                    {item.quantity}
                                </div>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="btn-animate"
                                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                ><Plus size={14} /></button>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-bold)', width: '70px', textAlign: 'right', fontSize: 'var(--font-md)' }}>
                                ₼{(item.sell_price * item.quantity).toFixed(2)}
                            </div>
                            <button className="btn btn-ghost btn-icon btn-animate" onClick={() => removeItem(item.id)} style={{ color: 'var(--color-text-tertiary)' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Area */}
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', background: 'var(--color-bg-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                    <span>Cəmi:</span>
                    <span>₼{subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Güzəşt:</span>
                    <div style={{ position: 'relative', width: '100px' }}>
                        <span style={{ position: 'absolute', left: 8, top: 8, color: 'var(--color-text-tertiary)' }}>₼</span>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={discountInput}
                            onChange={handleDiscountChange}
                            style={{ width: '100%', padding: '6px 8px 6px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'linear-gradient(135deg, var(--color-primary), #4338ca)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)', color: 'white' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'var(--font-xs)', opacity: 0.8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toplam Məbləğ</span>
                        <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-weight-black)' }}>₼{total.toFixed(2)}</span>
                    </div>
                    <button
                        className="btn-animate"
                        style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '800', fontSize: 'var(--font-sm)', backdropFilter: 'blur(4px)', cursor: 'pointer' }}
                        onClick={() => onCheckout()}
                    >
                        ÖDƏNİŞ <ArrowRight size={18} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}
