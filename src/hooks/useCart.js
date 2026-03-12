import { useState, useMemo } from 'react';

export function useCart() {
    const [items, setItems] = useState([]);
    const [discountAmount, setDiscountAmount] = useState(0);

    const addItem = (product) => {
        setItems((currentItems) => {
            const existing = currentItems.find(item => item.id === product.id);
            if (existing) {
                // limit by stock if desired. For MVP, we let them over-sell and let stock go negative,
                // or prevent it. We prevent it:
                if (existing.quantity >= product.stock_quantity) {
                    alert('Bazada kifayət qədər məhsul yoxdur.');
                    return currentItems;
                }

                return currentItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                if (product.stock_quantity <= 0) {
                    alert('Bu məhsul bazada bitib.');
                    return currentItems;
                }
                return [...currentItems, { ...product, quantity: 1 }];
            }
        });
    };

    const removeItem = (productId) => {
        setItems((currentItems) => currentItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }

        setItems((currentItems) =>
            currentItems.map(item => {
                if (item.id === productId) {
                    if (newQuantity > item.stock_quantity) {
                        alert('Bazada kifayət qədər məhsul yoxdur.');
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setItems([]);
        setDiscountAmount(0);
    };

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);
    }, [items]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - discountAmount);
    }, [subtotal, discountAmount]);

    return {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        discountAmount,
        setDiscountAmount,
        total
    };
}
