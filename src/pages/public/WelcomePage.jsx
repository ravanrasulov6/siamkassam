import { Link } from 'react-router-dom';
import { Rocket, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.png';
import './WelcomePage.css';

export default function WelcomePage() {
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
                        <div className="feature-card glass-panel stagger-1">
                            <Zap className="feature-icon" size={32} />
                            <h3>Sürətli Satış</h3>
                            <p>İldırım sürətində POS sistemi ilə müştərilərinizi gözlətməyin.</p>
                        </div>
                        <div className="feature-card glass-panel stagger-2">
                            <ShieldCheck className="feature-icon" size={32} />
                            <h3>Təhlükəsizlik</h3>
                            <p>Məlumatlarınız ən yüksək səviyyəli şifrələmə ilə qorunur.</p>
                        </div>
                        <div className="feature-card glass-panel stagger-3">
                            <Rocket className="feature-icon" size={32} />
                            <h3>Analitika</h3>
                            <p>Biznesinizin artımını real vaxt rejimində izləyin.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
