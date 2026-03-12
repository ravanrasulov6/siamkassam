import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
    Layout, ShoppingCart, Box, Users, CreditCard,
    DollarSign, BarChart2, Cpu, Settings, LogOut, Mail
} from 'react-feather';
import logo from '../../assets/logo.png';

const ManatIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M7 14h10M7 10h10" />
    </svg>
);

const icons = {
    dashboard: <Layout size={20} />,
    sales: <ShoppingCart size={20} />,
    products: <Box size={20} />,
    customers: <Users size={20} />,
    debts: <CreditCard size={20} />,
    expenses: <ManatIcon size={20} />,
    reports: <BarChart2 size={20} />,
    ai: <Cpu size={20} />,
    messages: <Mail size={20} />,
    settings: <Settings size={20} />,
    logout: <LogOut size={20} />
};

export default function Sidebar() {
    const { business, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '/sales', icon: 'sales', label: 'Satış (POS)' },
        { path: '/products', icon: 'products', label: 'Məhsullar' },
        { path: '/customers', icon: 'customers', label: 'Müştərilər' },
        { path: '/debts', icon: 'debts', label: 'Borclar' },
        { path: '/expenses', icon: 'expenses', label: 'Xərclər' },
        { path: '/reports', icon: 'reports', label: 'Hesabatlar' },
        { path: '/ai', icon: 'ai', label: 'AI Mərkəzi' },
        { path: '/messages', icon: 'messages', label: 'Məktublarım' },
        { path: '/settings', icon: 'settings', label: 'Tənzimləmələr' }
    ];

    const initials = profile
        ? `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase()
        : 'SK';

    return (
        <div className="sidebar-wrap" style={{
            width: 'var(--sidebar-width)',
            background: 'var(--sidebar-bg)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0,
            flexShrink: 0,
            borderRight: 'none'
        }}>
            {/* Brand */}
            <div style={{
                padding: 'var(--space-6) var(--space-5)',
                borderBottom: '1px solid var(--sidebar-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)'
            }}>
                <div>
                    <div className="sidebar-logo-container">
                        <img src={logo} alt="SIAM Logo" className="sidebar-logo-img" />
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--sidebar-text)',
                        marginTop: '1px'
                    }}>
                        {business?.biz_name || 'Biznes Paneli'}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{
                flex: 1,
                padding: 'var(--space-4) var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                overflowY: 'auto'
            }}>
                {menuItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                            background: isActive ? 'var(--sidebar-bg-hover)' : 'transparent',
                            fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                            textDecoration: 'none',
                            fontSize: 'var(--font-sm)',
                            transition: 'all var(--transition-fast)',
                            position: 'relative'
                        })}
                    >
                        {isActive => (
                            <>
                                {isActive.isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 3,
                                        height: 20,
                                        background: 'var(--sidebar-accent)',
                                        borderRadius: '0 var(--radius-full) var(--radius-full) 0'
                                    }} />
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: isActive.isActive ? 1 : 0.7 }}>
                                    {icons[item.icon]}
                                </span>
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer — User Info + Logout */}
            <div style={{
                padding: 'var(--space-4) var(--space-3)',
                borderTop: '1px solid var(--sidebar-border)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '8px 12px',
                    marginBottom: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--sidebar-bg-hover)'
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, #475569, #334155)',
                        color: '#CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0
                    }}>
                        {initials}
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sidebar-text-active)', lineHeight: 1.3 }}>
                            {profile?.first_name || 'İstifadəçi'} {profile?.last_name || ''}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--sidebar-text)', lineHeight: 1.3 }}>
                            Sahibkar
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        fontFamily: 'var(--font-family)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    {icons.logout}
                    <span>Çıxış Et</span>
                </button>
            </div>
        </div>
    );
}
