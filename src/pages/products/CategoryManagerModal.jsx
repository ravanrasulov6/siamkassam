import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { categoriesService } from '../../services/categories.service';
import { useAuth } from '../../context/AuthContext';

export default function CategoryManagerModal({ isOpen, onClose, categories, onCategoryAdded }) {
    const { business } = useAuth();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError('');

        try {
            const newCat = await categoriesService.create({
                business_id: business.id,
                name: name.trim(),
                color: '#4F46E5', // default color
            });

            setName('');
            if (onCategoryAdded) onCategoryAdded(newCat);
        } catch (err) {
            setError(err.message || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) return;
        try {
            await categoriesService.delete(id);
            if (onCategoryAdded) onCategoryAdded(); // trigger refresh
        } catch (err) {
            alert('Silinmə zamanı xəta: ' + err.message);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kateqoriyalar">
            <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-6)' }}>
                <div className="form-group" style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 0 }}>
                    <input
                        type="text"
                        placeholder="Yeni kateqoriya adı..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        style={{ flex: 1 }}
                        autoFocus
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
                        {loading ? '...' : 'Əlavə et'}
                    </button>
                </div>
                {error && <p className="form-error">{error}</p>}
            </form>

            <div className="categories-list">
                <h4 style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                    Mövcud Kateqoriyalar ({categories?.length || 0})
                </h4>

                {(!categories || categories.length === 0) ? (
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-sm)' }}>Hələ kateqoriya yaradılmayıb.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {categories.map(cat => (
                            <li
                                key={cat.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--space-3)',
                                    background: 'var(--color-surface-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border-light)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                                    <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{cat.name}</span>
                                </div>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => handleDelete(cat.id)}
                                    style={{ color: 'var(--color-danger)' }}
                                    title="Sil"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
