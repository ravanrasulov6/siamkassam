import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { productsService } from '../../services/products.service';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
    name: '',
    barcode: '',
    category_id: '',
    unit: 'ədəd',
    buy_price: '',
    sell_price: '',
    stock_quantity: '',
    min_stock_threshold: '5',
};

export default function ProductFormModal({ isOpen, onClose, productToEdit, categories, onSaved }) {
    const { business } = useAuth();
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset form when opening/closing or changing edit target
    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setFormData({
                    ...productToEdit,
                    category_id: productToEdit.category_id || '',
                });
            } else {
                setFormData(INITIAL_FORM);
            }
            setError('');
        }
    }, [isOpen, productToEdit]);

    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Prepare payload
        const payload = {
            business_id: business.id,
            name: formData.name.trim(),
            barcode: formData.barcode?.trim() || null,
            category_id: formData.category_id || null,
            unit: formData.unit,
            buy_price: parseFloat(formData.buy_price) || 0,
            sell_price: parseFloat(formData.sell_price) || 0,
            stock_quantity: parseFloat(formData.stock_quantity) || 0,
            min_stock_threshold: parseFloat(formData.min_stock_threshold) || 5,
        };

        try {
            if (productToEdit) {
                await productsService.update(productToEdit.id, payload);
            } else {
                await productsService.create(payload);
            }
            onSaved(); // trigger list refresh
            onClose(); // close modal
        } catch (err) {
            setError(err.message || 'Yadda saxlama zamanı xəta baş verdi');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={productToEdit ? 'Məhsula Düzəliş Et' : 'Yeni Məhsul Əlavə Et'}
            maxWidth="720px"
        >
            <form onSubmit={handleSubmit}>
                {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-6)' }}>

                    {/* Column 1: General Info */}
                    <div>
                        <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-4)' }}>
                            Ümumi Məlumat
                        </h3>

                        <div className="form-group">
                            <label>Məhsulun adı *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="Məs: iPhone 15 Pro 256GB"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Barkod / SKU</label>
                            <input
                                type="text"
                                value={formData.barcode}
                                onChange={e => handleChange('barcode', e.target.value)}
                                placeholder="Skan edin və ya yazın..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Kateqoriya</label>
                            <select
                                value={formData.category_id}
                                onChange={e => handleChange('category_id', e.target.value)}
                            >
                                <option value="">-- Kateqoriya seçin --</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Ölçü vahidi</label>
                            <select
                                value={formData.unit}
                                onChange={e => handleChange('unit', e.target.value)}
                            >
                                <option value="ədəd">Ədəd</option>
                                <option value="kq">Kiloqram (kq)</option>
                                <option value="litr">Litr</option>
                                <option value="metr">Metr</option>
                                <option value="qutu">Qutu</option>
                            </select>
                        </div>
                    </div>

                    {/* Column 2: Pricing & Stock */}
                    <div>
                        <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-4)' }}>
                            Qiymət və Stok
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <div className="form-group">
                                <label>Alış qiyməti (₼)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.buy_price}
                                    onChange={e => handleChange('buy_price', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-group">
                                <label>Satış qiyməti (₼) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.sell_price}
                                    onChange={e => handleChange('sell_price', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
                            <label>İlkin stok miqdarı</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.stock_quantity}
                                onChange={e => handleChange('stock_quantity', e.target.value)}
                                placeholder="Neçə ədəd var?"
                                disabled={!!productToEdit} // if editing, stock should be changed via physical stock adjustment, not base form usually. But for MVP we can allow it or disable. Let's disable if editing to prevent accidental override.
                                title={productToEdit ? "Stok miqdarını dəyişmək üçün xüsusi stok əməliyyatı istifadə edilməlidir" : ""}
                            />
                            {!!productToEdit && <div className="form-hint">Mövcud məhsulun stokunu yalnız "Stok hərəkəti" ilə dəyişmək tövsiyə olunur.</div>}
                        </div>

                        <div className="form-group">
                            <label>Kritik stok xəbərdarlığı</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.min_stock_threshold}
                                onChange={e => handleChange('min_stock_threshold', e.target.value)}
                                placeholder="Məs: 5"
                            />
                            <div className="form-hint">Anbarda bu miqdardan az qaldıqda xəbərdarlıq veriləcək.</div>
                        </div>
                    </div>

                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-6)',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Ləğv et
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner spinner-sm" /> : 'Yadda saxla 💾'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
