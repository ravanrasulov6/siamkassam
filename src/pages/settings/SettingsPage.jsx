import { useState, useEffect } from 'react';
import { settingsService } from '../../services/settings.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    Briefcase, Users, Printer, Shield, User,
    AtSign, Phone, MapPin, Hash, Save,
    Plus, X, Check, Eye, MessageCircle
} from 'react-feather';
import { whatsappService } from '../../services/whatsapp.service';

export default function SettingsPage() {
    const { business, updateProfile, refreshProfile } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({ name: '', phone: '', address: '', tax_id: '' });
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('cashier');

    // Receipt settings
    const [receiptSettings, setReceiptSettings] = useState({
        footer_text: 'Alış-verişiniz üçün təşəkkürlər!',
        show_logo: true,
        show_business_name: true,
        show_address: true,
        show_phone: true
    });
    const [receiptSaving, setReceiptSaving] = useState(false);

    // WhatsApp settings
    const [whatsappStatus, setWhatsappStatus] = useState({ phone: '', verified: false });
    const [waInput, setWaInput] = useState('');
    const [waCodeInput, setWaCodeInput] = useState('');
    const [waStep, setWaStep] = useState('input'); // input, verify, success
    const [waLoading, setWaLoading] = useState(false);

    useEffect(() => {
        if (business) {
            setFormData({
                name: business.name || '',
                phone: business.phone || '',
                address: business.address || '',
                tax_id: business.tax_id || ''
            });
            setWhatsappStatus({
                phone: business.whatsapp_phone || '',
                verified: !!business.whatsapp_verified
            });
            if (business.whatsapp_phone) {
                setWaInput(business.whatsapp_phone);
                if (business.whatsapp_verified) setWaStep('success');
            }
            loadEmployees();
        }
    }, [business]);

    async function loadEmployees() {
        if (!business?.id) return;
        try {
            const emps = await settingsService.getEmployees(business.id);
            setEmployees(emps);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        try {
            setSaving(true);
            await updateProfile({
                biz_name: formData.name,
                biz_phone: formData.phone,
                biz_address: formData.address,
            });
            showSuccess('Biznes profili yeniləndi');
        } catch (err) {
            showError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function handleInviteUser(e) {
        e.preventDefault();
        showInfo(`Dəvətnamə göndərildi: ${inviteEmail}`);
        setInviteEmail('');
        setShowInviteForm(false);
    }

    function handleSaveReceipt(e) {
        e.preventDefault();
        setReceiptSaving(true);
        localStorage.setItem('siam_receipt_settings', JSON.stringify(receiptSettings));
        setTimeout(() => {
            setReceiptSaving(false);
            showSuccess('Çek tənzimləmələri yadda saxlanıldı');
        }, 300);
    }

    async function handleWhatsAppVerify() {
        try {
            setWaLoading(true);
            await whatsappService.initiateVerification(waInput);
            setWaStep('verify');
            showInfo('Təsdiqləmə kodu WhatsApp nömrənizə göndərildi');
        } catch (err) {
            showError(err.message);
        } finally {
            setWaLoading(false);
        }
    }

    async function handleConfirmCode() {
        try {
            setWaLoading(true);
            await whatsappService.verifyCode(waCodeInput);
            setWaStep('success');
            setWhatsappStatus(prev => ({ ...prev, verified: true }));
            await refreshProfile();
            showSuccess('Numrəniz uğurla təsdiqləndi!');
        } catch (err) {
            showError(err.message);
        } finally {
            setWaLoading(false);
        }
    }

    function handleResetWhatsApp() {
        setWaStep('input');
        setWaCodeInput('');
    }

    useEffect(() => {
        const saved = localStorage.getItem('siam_receipt_settings');
        if (saved) {
            try { setReceiptSettings(JSON.parse(saved)); } catch { }
        }
    }, []);

    const tabs = [
        { key: 'profile', icon: <Briefcase size={18} />, label: 'Biznes Profili' },
        { key: 'users', icon: <Users size={18} />, label: 'İstifadəçilər & Rollar' },
        { key: 'receipts', icon: <Printer size={18} />, label: 'Çek Tənzimləmələri' },
        { key: 'whatsapp', icon: <MessageCircle size={18} />, label: 'WhatsApp İnteqrasiyası' }
    ];

    return (
        <div style={{ padding: 'var(--space-8) var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <div className="animate-fade-in-up" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: 'var(--space-8)',
                padding: 'var(--space-2) 0'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, var(--color-text-secondary), var(--color-text-tertiary))',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <Briefcase size={28} />
                </div>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>Tənzimləmələr</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>Sistem və biznes parametrlərini buradan idarə edin</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', flexDirection: 'row' }} className="responsive-settings-container">
                {/* Left nav - Sidebar style */}
                <div style={{ width: '280px', flexShrink: 0, minWidth: 'min(100%, 280px)' }} className="animate-fade-in-up stagger-1">
                    <div className="glass-card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-elevated)', borderRadius: '20px' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                className="btn-animate"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 18px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: 'var(--font-sm)',
                                    fontWeight: '600',
                                    background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                                    color: activeTab === tab.key ? 'white' : 'var(--color-text-secondary)',
                                    transition: 'all 0.2s',
                                    marginBottom: '4px'
                                }}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <span style={{ opacity: activeTab === tab.key ? 1 : 0.7 }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="glass-card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-primary-light)', border: 'none', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-dark)', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
                            <Shield size={14} /> Təhlükəsizlik
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--color-primary-dark)', opacity: 0.8, lineHeight: 1.5 }}>
                            Bütün məlumatlar Supabase tərəfindən yüksək səviyyədə qorunur və hər gün ehtiyat nüsxəsi çıxarılır.
                        </p>
                    </div>
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, minWidth: 'min(100%, 400px)' }} className="animate-fade-in-up stagger-2">
                    {activeTab === 'profile' && (
                        <div className="glass-card animate-fade-in" style={{ padding: 'var(--space-8)', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-8)' }}>
                                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '10px', borderRadius: '12px' }}>
                                    <Briefcase size={24} />
                                </div>
                                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>Biznes Profili</h2>
                            </div>

                            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '700px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Biznesin Adı</label>
                                    <input type="text" className="input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ height: '52px', borderRadius: '14px' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={14} /> VÖEN</label>
                                        <input type="text" className="input" value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} style={{ height: '52px', borderRadius: '14px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Əlaqə Nömrəsi</label>
                                        <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ height: '52px', borderRadius: '14px' }} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Ünvan</label>
                                    <textarea className="input" rows="3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ borderRadius: '14px' }}></textarea>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                                    <button type="submit" className="btn btn-primary btn-lg btn-animate" disabled={saving} style={{ padding: '0 40px', borderRadius: '14px', gap: '8px' }}>
                                        {saving ? <div className="spinner"></div> : <><Save size={18} /> Yadda Saxla</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="glass-card animate-fade-in" style={{ padding: 'var(--space-8)', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '10px', borderRadius: '12px' }}>
                                        <Users size={24} />
                                    </div>
                                    <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>İstifadəçilər & Rollar</h2>
                                </div>
                                <button className={`btn btn-animate ${showInviteForm ? 'btn-outline' : 'btn-primary'}`} onClick={() => setShowInviteForm(!showInviteForm)} style={{ gap: '8px' }}>
                                    {showInviteForm ? <><X size={16} /> Ləğv Et</> : <><Plus size={16} /> İstifadəçi Əlavə Et</>}
                                </button>
                            </div>

                            {showInviteForm && (
                                <form onSubmit={handleInviteUser} className="animate-fade-in" style={{ background: 'var(--color-bg)', padding: '24px', borderRadius: '20px', marginBottom: '32px', border: '1px solid var(--color-border-light)' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Yeni İstifadəçi Dəvəti</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px' }}>E-poçt ünvanı</label>
                                            <div style={{ position: 'relative' }}>
                                                <AtSign size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                                <input type="email" className="input" required placeholder="kassir@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ paddingLeft: '44px', height: '48px' }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px' }}>Rol</label>
                                            <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ height: '48px' }}>
                                                <option value="cashier">Kassir</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn btn-primary btn-animate" style={{ height: '48px', padding: '0 24px' }}>Dəvət et</button>
                                    </div>
                                </form>
                            )}

                            <div className="table-container" style={{ borderRadius: '16px', border: '1px solid var(--color-border-light)' }}>
                                <table className="table" style={{ margin: 0 }}>
                                    <thead>
                                        <tr>
                                            <th>İstifadəçi</th>
                                            <th>ID (Qısa)</th>
                                            <th>Rol</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div className="avatar" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                                            {emp.first_name?.[0] || '?'}{emp.last_name?.[0] || ''}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{emp.first_name} {emp.last_name}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Son giriş: bu gün</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.6 }}>{emp.id.split('-')[0]}</td>
                                                <td><span className="badge badge-info">Admin</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: '600', fontSize: '12px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: 'var(--color-success)' }}></div> Aktiv
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'receipts' && (
                        <div className="glass-card animate-fade-in" style={{ padding: 'var(--space-8)', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-8)' }}>
                                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '10px', borderRadius: '12px' }}>
                                    <Printer size={24} />
                                </div>
                                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>Çek Tənzimləmələri</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '40px' }}>
                                <form onSubmit={handleSaveReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                    <div className="form-group">
                                        <label>Çek Altlıq Mətni</label>
                                        <input type="text" className="input" value={receiptSettings.footer_text} onChange={e => setReceiptSettings({ ...receiptSettings, footer_text: e.target.value })} style={{ height: '48px' }} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {[
                                            { key: 'show_business_name', label: 'Biznesin adını göstər' },
                                            { key: 'show_address', label: 'Ünvanı göstər' },
                                            { key: 'show_phone', label: 'Telefon nömrəsini göstər' },
                                            { key: 'show_logo', label: 'Mağaza loqosunu göstər' },
                                        ].map(opt => (
                                            <label key={opt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' }}>
                                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: '500' }}>{opt.label}</span>
                                                <div className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={receiptSettings[opt.key]}
                                                        onChange={e => setReceiptSettings({ ...receiptSettings, [opt.key]: e.target.checked })}
                                                        id={`toggle-${opt.key}`}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div
                                                        onClick={() => setReceiptSettings({ ...receiptSettings, [opt.key]: !receiptSettings[opt.key] })}
                                                        style={{
                                                            width: '44px',
                                                            height: '24px',
                                                            background: receiptSettings[opt.key] ? 'var(--color-success)' : 'var(--color-border)',
                                                            borderRadius: '12px',
                                                            position: 'relative',
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            background: 'white',
                                                            borderRadius: '50%',
                                                            position: 'absolute',
                                                            top: '3px',
                                                            left: receiptSettings[opt.key] ? '23px' : '3px',
                                                            transition: 'all 0.3s',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                        }}></div>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-animate btn-lg" disabled={receiptSaving} style={{ marginTop: 'auto', gap: '8px' }}>
                                        {receiptSaving ? <div className="spinner"></div> : <><Check size={18} /> Tənzimləmələri Saxla</>}
                                    </button>
                                </form>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                                        <Eye size={14} /> Canlı Önizləmə
                                    </div>
                                    {/* Thermal Receipt Style Preview */}
                                    <div style={{
                                        background: '#fff',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                        borderRadius: '4px',
                                        padding: '40px 24px',
                                        fontFamily: "'Courier New', Courier, monospace",
                                        fontSize: '12px',
                                        color: '#333',
                                        position: 'relative',
                                        border: '1px solid #eee'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'repeating-linear-gradient(90deg, #ccc, #ccc 2px, transparent 2px, transparent 4px)' }}></div>

                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            {receiptSettings.show_logo && <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏪</div>}
                                            {receiptSettings.show_business_name && <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>{business?.name || 'SIAM KASSAM STORE'}</div>}
                                            {receiptSettings.show_address && <div style={{ fontSize: '10px' }}>{business?.address || 'Bakı, Azərbaycan'}</div>}
                                            {receiptSettings.show_phone && <div style={{ fontSize: '10px' }}>TEL: {business?.phone || '+994 XX XXX XX XX'}</div>}
                                        </div>

                                        <div style={{ borderTop: '1px dashed #333', margin: '12px 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>X-0001</span> <span>{new Date().toLocaleDateString()}</span></div>
                                        <div style={{ borderTop: '1px dashed #333', margin: '12px 0' }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>iPhone 15 Pro</span> <span>1999.00</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>USB-C Charger</span> <span>45.00</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Leather Case</span> <span>120.00</span></div>

                                        <div style={{ borderTop: '1px dashed #333', margin: '12px 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                                            <span>TOPLAM:</span> <span>₼2164.00</span>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #333', margin: '12px 0' }}></div>

                                        <div style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '20px', fontSize: '10px' }}>
                                            {receiptSettings.footer_text}
                                        </div>

                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'repeating-linear-gradient(90deg, #ccc, #ccc 2px, transparent 2px, transparent 4px)' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="glass-card animate-fade-in" style={{ padding: 'var(--space-8)', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-8)' }}>
                                <div style={{ background: '#25D36622', color: '#25D366', padding: '10px', borderRadius: '12px' }}>
                                    <MessageCircle size={24} />
                                </div>
                                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>WhatsApp İnteqrasiyası</h2>
                            </div>

                            <div style={{ maxWidth: '600px' }}>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
                                    Siam Kassam-ı WhatsApp ilə əlaqələndirərək səsli mesajlarla məhsul əlavə edə, satışlar barədə məlumat ala və AI köməkçisindən istifadə edə bilərsiniz.
                                </p>

                                {waStep === 'input' && (
                                    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> WhatsApp Nömrəniz</label>
                                            <input 
                                                type="tel" 
                                                className="input" 
                                                placeholder="+99450XXXXXXX" 
                                                value={waInput} 
                                                onChange={e => setWaInput(e.target.value)} 
                                                style={{ height: '52px', borderRadius: '14px', fontSize: '16px' }} 
                                            />
                                            <small style={{ marginTop: '8px', display: 'block', color: 'var(--color-text-tertiary)' }}>
                                                Nömrəni beynəlxalq formatda daxil edin (məs: +994501234567)
                                            </small>
                                        </div>
                                        <button 
                                            className="btn btn-primary btn-lg btn-animate" 
                                            onClick={handleWhatsAppVerify}
                                            disabled={waLoading || !waInput}
                                            style={{ backgroundColor: '#25D366', borderColor: '#25D366', borderRadius: '14px' }}
                                        >
                                            {waLoading ? <div className="spinner"></div> : 'Təsdiqləmə Kodu Göndər'}
                                        </button>
                                    </div>
                                )}

                                {waStep === 'verify' && (
                                    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '12px', marginBottom: '8px', borderLeft: '4px solid #25D366' }}>
                                            <p style={{ margin: 0, fontSize: '14px' }}>
                                                <b>{waInput}</b> nömrəsinə 6 rəqəmli kod göndərildi. Zəhmət olmasa daxil edin.
                                            </p>
                                        </div>
                                        <div className="form-group">
                                            <label>Təsdiqləmə Kodu</label>
                                            <input 
                                                type="text" 
                                                className="input" 
                                                placeholder="123456" 
                                                maxLength="6"
                                                value={waCodeInput} 
                                                onChange={e => setWaCodeInput(e.target.value)} 
                                                style={{ height: '52px', borderRadius: '14px', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }} 
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button className="btn btn-outline btn-animate" onClick={handleResetWhatsApp} style={{ flex: 1, borderRadius: '14px' }}>Geri</button>
                                            <button 
                                                className="btn btn-primary btn-animate" 
                                                onClick={handleConfirmCode}
                                                disabled={waLoading || waCodeInput.length < 6}
                                                style={{ flex: 2, backgroundColor: '#25D366', borderColor: '#25D366', borderRadius: '14px' }}
                                            >
                                                {waLoading ? <div className="spinner"></div> : 'Təsdiqlə'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {waStep === 'success' && (
                                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div style={{ background: '#25D36622', color: '#25D366', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                            <Check size={40} />
                                        </div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>WhatsApp Bağlandı!</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                                            <b>{waInput}</b> nömrəsi ilə sistemdən istifadə edə bilərsiniz.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left' }}>
                                            <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'var(--color-bg)' }}>
                                                <h4 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Səsli Əmrlər</h4>
                                                <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>"30 manatlıq çörək aldım" yazın və ya səs atın.</p>
                                            </div>
                                            <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'var(--color-bg)' }}>
                                                <h4 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>Sorğular</h4>
                                                <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>"Bu gün nə qədər satış olub?" deyə soruşun.</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-link btn-animate" onClick={handleResetWhatsApp} style={{ marginTop: '32px', color: 'var(--color-text-tertiary)' }}>Nömrəni Dəyiş</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
