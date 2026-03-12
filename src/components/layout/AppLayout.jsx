import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout({ children, hideSidebar = false }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {!hideSidebar && <Sidebar />}

            <main className="app-main-content" style={{ flex: 1, overflowY: 'auto' }}>
                {children}
            </main>

            {!hideSidebar && <MobileBottomNav />}
        </div>
    );
}
