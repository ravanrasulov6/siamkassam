import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { salesService } from '../../services/sales.service';
import { Search, ShoppingCart, X } from 'react-feather';
import ProductGrid from './ProductGrid';
import CartPanel from './CartPanel';
import CheckoutModal from './CheckoutModal';
import './pos.css';

export default function POSPage() {
    const { business, user } = useAuth();
    const { showSuccess, showError } = useToast();

    const { products, categories, loading: productsLoading, filters, setFilters, refreshProducts } = useProducts({ search: '', category: '' });
    const { customers } = useCustomers();
    const cart = useCart();

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mobileCartOpen, setMobileCartOpen] = useState(false);

    const handleCheckoutConfirm = async (checkoutData) => {
        try {
            setIsProcessing(true);
            await salesService.processCheckout({
                businessId: business.id,
                cashierId: user.id,
                customerId: checkoutData.customerId,
                items: cart.items,
                paymentMethod: checkoutData.paymentMethod,
                paidAmount: checkoutData.paidAmount,
                discountAmount: cart.discountAmount
            });

            showSuccess('Satış uğurla tamamlandı!');
            cart.clearCart();
            setIsCheckoutOpen(false);
            setMobileCartOpen(false);
            refreshProducts();
        } catch (err) {
            showError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="pos-layout">
            {/* LEFT: Product Catalog */}
            <div className="pos-products-panel">
                {/* Header / Search */}
                <div className="pos-search-bar glass-card" style={{
                    padding: 'var(--space-4) var(--space-5)',
                    margin: 'var(--space-4)',
                    borderBottom: 'none'
                }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-tertiary)'
                        }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Barkod və ya ad ilə məhsul axtar..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            style={{
                                paddingLeft: '44px',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-xl)',
                                background: 'var(--color-surface)',
                                height: '48px',
                                fontSize: 'var(--font-sm)',
                                transition: 'var(--transition-fast)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="pos-category-tabs glass-card" style={{
                    padding: 'var(--space-3) var(--space-4)',
                    gap: 'var(--space-2)',
                    margin: '0 var(--space-4) var(--space-4) var(--space-4)',
                    borderBottom: 'none'
                }}>
                    <button
                        className={`btn-animate ${filters.category === '' ? 'pos-cat-active' : 'pos-cat-inactive'}`}
                        style={{
                            borderRadius: 'var(--radius-full)',
                            padding: '8px 20px',
                            fontSize: 'var(--font-xs)',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
                    >
                        Bütün Məhsullar
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`btn-animate ${filters.category === cat.id ? 'pos-cat-active' : 'pos-cat-inactive'}`}
                            style={{
                                borderRadius: 'var(--radius-full)',
                                padding: '8px 20px',
                                fontSize: 'var(--font-xs)',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Scrollable Product Grid */}
                <div className="pos-product-grid-scroll">
                    <ProductGrid
                        products={products}
                        loading={productsLoading}
                        onAdd={cart.addItem}
                    />
                </div>
            </div>

            {/* RIGHT: Cart Panel — Desktop */}
            <div className="pos-cart-panel-desktop">
                <CartPanel
                    cart={cart}
                    onCheckout={() => setIsCheckoutOpen(true)}
                />
            </div>

            {/* Mobile: Floating Cart Button */}
            {cart.items.length > 0 && (
                <button
                    className="pos-mobile-cart-fab btn-animate"
                    onClick={() => setMobileCartOpen(true)}
                >
                    <ShoppingCart size={24} />
                    <span className="pos-fab-badge">{cart.items.length}</span>
                    <span className="pos-fab-total">₼{cart.total.toFixed(2)}</span>
                </button>
            )}

            {/* Mobile: Cart Drawer Overlay */}
            {mobileCartOpen && (
                <div className="pos-mobile-cart-overlay" onClick={() => setMobileCartOpen(false)} />
            )}

            <div className={`pos-mobile-cart-drawer ${mobileCartOpen ? 'open' : ''}`}>
                <div className="pos-mobile-cart-drawer-header">
                    <h3>Səbət</h3>
                    <button className="mobile-more-close btn-animate" onClick={() => setMobileCartOpen(false)}><X size={20} /></button>
                </div>
                <div className="pos-mobile-cart-drawer-body">
                    <CartPanel
                        cart={cart}
                        onCheckout={() => setIsCheckoutOpen(true)}
                    />
                </div>
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cart={cart}
                customers={customers}
                onConfirm={handleCheckoutConfirm}
                loading={isProcessing}
            />
        </div>
    );
}
