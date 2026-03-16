import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ShieldCheck, Zap, ChevronDown, X } from 'lucide-react';
import logo from '../../assets/logo.png';
import './WelcomePage.css';

const FEATURES = [
    {
        icon: Zap,
        title: 'Sürətli Satış',
        short: 'İldırım sürətində POS sistemi.',
        detail: 'Satış əməliyyatlarını saniyələr içində tamamlayın. Barkod skaneri, çevik ödəniş üsulları və avtomatik stok yeniləmə ilə müştərilərinizi gözlətməyin. Kassada sürət — müştəri məmnuniyyəti deməkdir.'
    },
    {
        icon: ShieldCheck,
        title: 'Təhlükəsizlik',
        short: 'Məlumatlarınız tam qorunur.',
        detail: 'Supabase infrastrukturu ilə bank səviyyəsində şifrələmə. Hər bir əməliyyat qeydə alınır, istifadəçi icazələri dəqiq tənzimlənir. Məlumatlarınız yalnız sizə məxsusdur.'
    },
    {
        icon: Rocket,
        title: 'Analitika',
        short: 'Real vaxt biznes təhlili.',
        detail: 'Satış trendləri, ən çox satılan məhsullar, gündəlik/aylıq hesabatlar — hamısı bir panel üzərindən. AI dəstəkli analitika ilə biznesinizin nəbzini hər an tutun.'
    }
];

export default function WelcomePage() {
    const [expandedCard, setExpandedCard] = useState(null);

    function toggleCard(index) {
        setExpandedCard(expandedCard === index ? null : index);
    }

    return (
        <div className="welcome-page">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="welcome-video-bg"
            >
                <source src="/assets/bg-video.mp4" type="video/mp4" />
            </video>
            <div className="welcome-overlay"></div>

            <div className="welcome-scroll-wrapper">
                <div className="welcome-content animate-fade-in-up">
                    <header className="welcome-header">
                        <img src={logo} alt="SIAM Logo" className="welcome-logo-img" />
                        <p className="welcome-subtitle">Biznesinizin Gələcəyi İndi Başlayır</p>
                    </header>

                    <main className="welcome-main">
                        <div className="welcome-actions">
                            <Link to="/login" className="btn btn-primary btn-lg btn-block persuasive-btn">
                                Sistemə Daxil Ol
                            </Link>
                            <Link to="/register" className="btn btn-outline btn-lg btn-block persuasive-btn-outline">
                                Yeni Hesab Yarat
                            </Link>
                        </div>

                        <div className="feature-grid">
                            {FEATURES.map((feat, i) => {
                                const Icon = feat.icon;
                                const isOpen = expandedCard === i;
                                return (
                                    <div
                                        key={i}
                                        className={`feature-card glass-panel ${isOpen ? 'expanded' : ''}`}
                                        onClick={() => toggleCard(i)}
                                    >
                                        <div className="feature-card-header">
                                            <Icon className="feature-icon" size={28} />
                                            <div className="feature-card-text">
                                                <h3>{feat.title}</h3>
                                                <p className="feature-short">{feat.short}</p>
                                            </div>
                                        </div>
                                        {isOpen && (
                                            <div className="feature-detail animate-fade-in-up">
                                                <p>{feat.detail}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </main>

                    <footer className="welcome-footer">
                        <p>© 2026 Siam Kassam. Bütün hüquqlar qorunur.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
