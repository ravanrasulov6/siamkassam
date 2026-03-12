import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '480px' }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // prevent background scrolling
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="modal-content" style={{ maxWidth }}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onClose}
                        aria-label="Bağla"
                    >
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
