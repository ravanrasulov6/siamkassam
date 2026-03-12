import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { DollarSign, CreditCard, Clipboard, User, Check, AlertCircle } from 'react-feather';
import { useToast } from '../../context/ToastContext';

export default function CheckoutModal({ isOpen, onClose, cart, customers, onConfirm, loading }) {
  const { total, subtotal, discountAmount } = cart;

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmountInput, setPaidAmountInput] = useState(total.toString());
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Keep the paid amount aligned with total when total changes, unless user manually changes it.
  React.useEffect(() => {
    if (isOpen) {
      setPaidAmountInput(total.toString());
      setPaymentMethod('cash');
      setSelectedCustomerId('');
    }
  }, [isOpen, total]);

  const paidAmount = Number(paidAmountInput);
  const isCredit = paymentMethod === 'credit' || paidAmount < total;

  const { showSuccess, showError, showInfo } = useToast();

  const handleConfirm = () => {
    if (isCredit && !selectedCustomerId) {
      showError('Nisyə satış üçün mütləq müştəri seçilməlidir!');
      return;
    }

    if (paidAmount < 0) {
      showError('Ödənilən məbləğ 0-dan kiçik ola bilməz.');
      return;
    }

    onConfirm({
      paymentMethod,
      paidAmount,
      customerId: selectedCustomerId || null
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ödəniş" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* Total Display */}
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Cəmi Məbləğ</div>
          <div style={{ fontSize: '3rem', fontWeight: 'var(--font-weight-black)', color: 'var(--color-text)' }}>
            ₼{total.toFixed(2)}
          </div>
          {discountAmount > 0 && (
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)', marginTop: 'var(--space-2)' }}>
              (₼{discountAmount.toFixed(2)} güzəşt tətbiq edilib)
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div>
          <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-2)' }}>Ödəniş Növü</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className={`btn btn-animate ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setPaymentMethod('cash'); setPaidAmountInput(total.toString()); }}
              style={{ padding: 'var(--space-4)', fontSize: 'var(--font-sm)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
            >
              <DollarSign size={20} /> Nəğd
            </button>
            <button
              type="button"
              className={`btn btn-animate ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setPaymentMethod('card'); setPaidAmountInput(total.toString()); }}
              style={{ padding: 'var(--space-4)', fontSize: 'var(--font-sm)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
            >
              <CreditCard size={20} /> Kart
            </button>
            <button
              type="button"
              className={`btn btn-animate ${paymentMethod === 'credit' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setPaymentMethod('credit'); setPaidAmountInput('0'); }}
              style={{ padding: 'var(--space-4)', fontSize: 'var(--font-sm)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', borderColor: paymentMethod === 'credit' ? 'var(--color-warning)' : '', backgroundColor: paymentMethod === 'credit' ? 'var(--color-warning)' : '', color: paymentMethod === 'credit' ? 'white' : '' }}
            >
              <Clipboard size={20} /> Nisyə
            </button>
          </div>
        </div>

        {/* Details Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Ödənilən Məbləğ (₼)</label>
            <input
              type="number"
              className="input"
              min="0"
              step="0.01"
              value={paidAmountInput}
              onChange={(e) => setPaidAmountInput(e.target.value)}
              style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Müştəri {isCredit && <span style={{ color: 'var(--color-danger)' }}>* (Zəruri)</span>}</label>
            <select
              className="input"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Standart Müştəri --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name || ''} ({c.phone || 'Nömrəsiz'})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Change / Debt Display */}
        {paidAmount > total && paymentMethod === 'cash' && (
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-success-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>
            Qalıq (Qaytarılmalıdır): ₼{(paidAmount - total).toFixed(2)}
          </div>
        )}

        {paidAmount < total && (
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-dark)', fontWeight: 'var(--font-weight-bold)' }}>
            Borc olaraq yazılacaq: ₼{(total - paidAmount).toFixed(2)}
          </div>
        )}

      </div>

      <div className="modal-footer" style={{ marginTop: 'var(--space-6)' }}>
        <button className="btn btn-outline btn-animate" onClick={onClose} disabled={loading}>Ləğv et</button>
        <button className="btn btn-primary btn-animate" onClick={handleConfirm} disabled={loading} style={{ gap: '8px' }}>
          {loading ? 'Gözləyin...' : <><Check size={18} /> Təsdiqlə və Satışı Tamamla</>}
        </button>
      </div>
    </Modal>
  );
}
