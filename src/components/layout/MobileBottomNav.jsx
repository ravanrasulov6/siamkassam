import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const svgIcon = (paths, viewBox = '0 0 24 24') => (
    <svg width="20" height="20" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths}
    </svg>
);

const PRIMARY_ITEMS = [
    { path: '/dashboard', icon: svgIcon(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>), label: 'Ev' },
    { path: '/sales', icon: svgIcon(<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>), label: 'POS' },
    { path: '/products', icon: svgIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>), label: 'Məhsul' },
    { path: '/debts', icon: svgIcon(<><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>), label: 'Borc' },
];

const MORE_ITEMS = [
    { path: '/customers', icon: svgIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>), label: 'Müştərilər' },
    { path: '/expenses', icon: svgIcon(<><path d="M12 5v14M7 14h10M7 10h10" /></>), label: 'Xərclər' },
    { path: '/reports', icon: svgIcon(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>), label: 'Hesabatlar' },
    { path: '/ai', icon: svgIcon(<><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>), label: 'AI Mərkəzi' },
    { path: '/settings', icon: svgIcon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>), label: 'Tənzimləmələr' },
];

const moreIcon = svgIcon(<><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>);

export default function MobileBottomNav() {
    const [showMore, setShowMore] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setShowMore(false);
    }, [location.pathname]);

    const isMoreActive = MORE_ITEMS.some(item => location.pathname.startsWith(item.path));

    return (
        <>
            {showMore && (
                <div
                    className="mobile-more-backdrop"
                    onClick={() => setShowMore(false)}
                />
            )}

            <div className={`mobile-more-menu ${showMore ? 'open' : ''}`}>
                <div className="mobile-more-header">
                    <span>Daha çox</span>
                    <button
                        className="mobile-more-close"
                        onClick={() => setShowMore(false)}
                    >
                        ✕
                    </button>
                </div>
                <div className="mobile-more-grid">
                    {MORE_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `mobile-more-item ${isActive ? 'active' : ''}`}
                            onClick={() => setShowMore(false)}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="mobile-bottom-nav">
                {PRIMARY_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">{item.icon}</span>
                        <span className="label">{item.label}</span>
                    </NavLink>
                ))}
                <button
                    className={`nav-item more-btn ${isMoreActive ? 'active' : ''} ${showMore ? 'open' : ''}`}
                    onClick={() => setShowMore(!showMore)}
                >
                    <span className="icon">{moreIcon}</span>
                    <span className="label">Daha çox</span>
                </button>
            </div>
        </>
    );
}
