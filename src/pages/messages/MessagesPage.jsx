import React, { useState, useEffect } from 'react';
import {
    Mail, BookOpen, Clock, Trash2, Archive, ChevronRight,
    BarChart2, Shield, Zap, ThumbsUp, ThumbsDown, Inbox,
    MoreVertical, ArrowLeft, Download, Share2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { messagesService } from '../../services/messages.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './MessagesPage.css';

export default function MessagesPage() {
    const { business } = useAuth();
    const { showSuccess, showError } = useToast();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [viewMode, setViewMode] = useState('inbox'); // inbox, archived

    useEffect(() => {
        if (business?.id) {
            loadMessages();
        }
    }, [business, viewMode]);

    async function loadMessages() {
        try {
            setLoading(true);
            const data = await messagesService.getMessages(business.id, viewMode === 'archived');
            setMessages(data);
            if (data.length > 0 && !selectedMessage) {
                // Optionally select first on desktop if needed, but keeping it empty for mobile-first feel
            }
        } catch (err) {
            showError('Məktublar yüklənərkən xəta baş verdi');
        } finally {
            setLoading(false);
        }
    }

    async function handleSelect(msg) {
        setSelectedMessage(msg);
        if (msg.status === 'unread') {
            try {
                await messagesService.markAsRead(msg.id);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            } catch (err) {
                console.error('Mark as read error:', err);
            }
        }
    }

    async function handleArchive(e, msg) {
        e.stopPropagation();
        try {
            const newArchivedState = !msg.is_archived;
            await messagesService.setArchived(msg.id, newArchivedState);
            setMessages(prev => prev.filter(m => m.id !== msg.id));
            if (selectedMessage?.id === msg.id) setSelectedMessage(null);
            showSuccess(newArchivedState ? 'Məktub arxivləndi' : 'Məktub qutuya qaytarıldı');
        } catch (err) {
            showError('Xəta baş verdi');
        }
    }

    async function handleDelete(e, msg) {
        e.stopPropagation();
        if (!window.confirm('Bu məktubu silmək istədiyinizə əminsiniz?')) return;
        try {
            await messagesService.deleteMessage(msg.id);
            setMessages(prev => prev.filter(m => m.id !== msg.id));
            if (selectedMessage?.id === msg.id) setSelectedMessage(null);
            showSuccess('Məktub silindi');
        } catch (err) {
            showError('Silinmə zamanı xəta baş verdi');
        }
    }

    async function handleFeedback(feedbackValue) {
        if (!selectedMessage) return;
        try {
            const newVal = selectedMessage.feedback === feedbackValue ? 0 : feedbackValue;
            await messagesService.submitFeedback(selectedMessage.id, newVal);
            setSelectedMessage(prev => ({ ...prev, feedback: newVal }));
            setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, feedback: newVal } : m));
            showSuccess('Rəyiniz qeydə alındı');
        } catch (err) {
            showError('Xəta baş verdi');
        }
    }

    const exportToPDF = () => {
        if (!selectedMessage) return;
        const doc = jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        // Simple layout for PDF
        doc.setFontSize(22);
        doc.text(selectedMessage.title, 20, 30);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Tarix: ${new Date(selectedMessage.created_at).toLocaleString('az-AZ')}`, 20, 40);

        doc.setLineWidth(0.5);
        doc.line(20, 45, 190, 45);

        doc.setFontSize(11);
        doc.setTextColor(50);
        const splitText = doc.splitTextToSize(selectedMessage.content, 170);
        doc.text(splitText, 20, 55);

        doc.save(`${selectedMessage.title.replace(/\s+/g, '_')}.pdf`);
        showSuccess('PDF sənədi hazırlandı');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: selectedMessage.title,
                    text: selectedMessage.content,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share canceled or failed');
            }
        } else {
            // Fallback for desktop: copy to clipboard
            navigator.clipboard.writeText(`${selectedMessage.title}\n\n${selectedMessage.content}`);
            showSuccess('Mətn kopyalandı! İstədiyiniz yerdə paylaşa bilərsiniz.');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'audit': return <Shield className="msg-type-icon audit" />;
            case 'recommendation': return <Zap className="msg-type-icon recommend" />;
            default: return <BarChart2 className="msg-type-icon generic" />;
        }
    };

    return (
        <div className="messages-page animate-fade-in">
            <header className="page-header-modern">
                <div className="header-left">
                    <div className="icon-badge primary pulse">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h1>Məktublarım</h1>
                        <p>Aİ tərəfindən hazırlanan strateji biznes hesabatları</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className={`tab-btn ${viewMode === 'inbox' ? 'active' : ''}`}
                        onClick={() => { setViewMode('inbox'); setSelectedMessage(null); }}
                    >
                        <Inbox size={18} /> Gələnlər
                    </button>
                    <button
                        className={`tab-btn ${viewMode === 'archived' ? 'active' : ''}`}
                        onClick={() => { setViewMode('archived'); setSelectedMessage(null); }}
                    >
                        <Archive size={18} /> Arxiv
                    </button>
                </div>
            </header>

            <div className={`messages-layout ${selectedMessage ? 'viewing' : ''}`}>
                {/* List Column */}
                <div className="messages-sidebar glass-card">
                    {loading ? (
                        <div className="p-8 text-center"><div className="spinner"></div></div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state p-12 text-center">
                            <Mail size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                            <h3>Burada heç nə yoxdur</h3>
                            <p>Yeni hesabatlar yaratmaq üçün Hesabatlar bölməsinə daxil olun.</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`message-item ${selectedMessage?.id === msg.id ? 'active' : ''} ${msg.status === 'unread' ? 'unread' : ''}`}
                                onClick={() => handleSelect(msg)}
                            >
                                <div className="msg-icon-wrap">
                                    {getIcon(msg.type)}
                                    {msg.status === 'unread' && <span className="unread-dot"></span>}
                                </div>
                                <div className="msg-info">
                                    <div className="msg-header-row">
                                        <h4>{msg.title}</h4>
                                    </div>
                                    <span className="msg-time">
                                        <Clock size={12} /> {new Date(msg.created_at).toLocaleDateString('az-AZ')}
                                    </span>
                                </div>
                                <div className="msg-item-actions">
                                    <button title="Archiv" onClick={(e) => handleArchive(e, msg)} className="icon-btn-subtle">
                                        <Archive size={14} />
                                    </button>
                                    <button title="Sil" onClick={(e) => handleDelete(e, msg)} className="icon-btn-subtle hover-danger">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Content Column */}
                <div className="message-viewer glass-card">
                    {selectedMessage ? (
                        <div className="viewer-content animate-fade-in-up">
                            <div className="viewer-header">
                                <div className="viewer-nav-mobile">
                                    <button className="back-btn" onClick={() => setSelectedMessage(null)}>
                                        <ArrowLeft size={20} />
                                    </button>
                                </div>
                                <div className="header-top">
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className={`status-badge ${selectedMessage.type}`}>
                                            {selectedMessage.type === 'audit' ? 'Audit Hesabatı' : 'Tövsiyə'}
                                        </span>
                                        {selectedMessage.is_archived && <span className="status-badge archived">Arxiv</span>}
                                    </div>
                                    <div className="viewer-actions">
                                        <button
                                            title="Like"
                                            className={`feedback-btn up ${selectedMessage.feedback === 1 ? 'active' : ''}`}
                                            onClick={() => handleFeedback(1)}
                                        >
                                            <ThumbsUp size={18} />
                                        </button>
                                        <button
                                            title="Dislike"
                                            className={`feedback-btn down ${selectedMessage.feedback === -1 ? 'active' : ''}`}
                                            onClick={() => handleFeedback(-1)}
                                        >
                                            <ThumbsDown size={18} />
                                        </button>
                                        <div className="divider"></div>
                                        <button title="Archive" onClick={(e) => handleArchive(e, selectedMessage)} className="action-btn-circle">
                                            <Archive size={18} />
                                        </button>
                                        <button title="Delete" onClick={(e) => handleDelete(e, selectedMessage)} className="action-btn-circle danger">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="divider"></div>
                                        <button className="btn btn-secondary-subtle btn-sm" onClick={handleShare}>
                                            <Share2 size={16} /> Paylaş
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={exportToPDF}>
                                            <Download size={16} /> PDF Yüklə
                                        </button>
                                    </div>
                                </div>
                                <h2>{selectedMessage.title}</h2>
                                <div className="msg-meta-detail">
                                    <Clock size={14} /> {new Date(selectedMessage.created_at).toLocaleString('az-AZ')}
                                </div>
                            </div>
                            <div className="viewer-body">
                                {selectedMessage.content.split('\n').map((line, i) => (
                                    <p key={i}>{line.trim()}</p>
                                ))}
                            </div>

                            <div className="viewer-footer">
                                <p>Bu analiz Siam Aİ tərəfindən biznesinizin real datasına əsasən hazırlanıb.</p>
                                <div className="footer-line"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="viewer-placeholder">
                            <div className="placeholder-art">
                                <BookOpen size={64} />
                                <div className="pulse-ring"></div>
                            </div>
                            <h3>Məktub seçilməyib</h3>
                            <p>Oxumaq istədiyiniz hesabatın üzərinə klikləyin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
