import React, { useState, useEffect } from 'react';
import { productsService } from '../../services/products.service';

export default function QuickStockEdit({ product, onUpdate }) {
    const [quantity, setQuantity] = useState(product.stock_quantity);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state if product row updates externally
    useEffect(() => {
        setQuantity(product.stock_quantity);
    }, [product.stock_quantity]);

    const handleUpdate = async (newQuantity) => {
        if (newQuantity < 0) newQuantity = 0;
        setQuantity(newQuantity);

        setIsSaving(true);
        try {
            await productsService.update(product.id, { stock_quantity: newQuantity });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Stock update failed:', error);
            alert('Stok yenilənmədi: ' + error.message);
            setQuantity(product.stock_quantity); // Revert on failure
        } finally {
            setIsSaving(false);
        }
    };

    const handleBlur = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val !== product.stock_quantity) {
            handleUpdate(val);
        } else {
            setQuantity(product.stock_quantity);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Trigger handleBlur
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isSaving ? 0.5 : 1 }}>
            <button
                className="btn btn-ghost btn-icon"
                style={{ padding: '2px', minWidth: '24px', height: '28px', border: '1px solid var(--color-border-light)' }}
                onClick={(e) => { e.stopPropagation(); handleUpdate(Number(quantity) - 1); }}
                disabled={isSaving || Number(quantity) <= 0}
            >
                -
            </button>
            <input
                type="number"
                value={quantity === null || quantity === undefined ? '' : quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                disabled={isSaving}
                style={{
                    width: '60px',
                    textAlign: 'center',
                    padding: '4px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)'
                }}
            />
            <button
                className="btn btn-ghost btn-icon"
                style={{ padding: '2px', minWidth: '24px', height: '28px', border: '1px solid var(--color-border-light)' }}
                onClick={(e) => { e.stopPropagation(); handleUpdate(Number(quantity) + 1); }}
                disabled={isSaving}
            >
                +
            </button>
        </div>
    );
}
