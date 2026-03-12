import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/5logo.png';
import './auth.css';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Şifrələr uyğun gəlmir');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password);
            navigate('/onboarding');
        } catch (err) {
            setError(err.message || 'Qeydiyyat zamanı xəta baş verdi');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <Link to="/" className="back-link">
                <ArrowLeft size={20} /> Ana Səhifəyə Qayıt
            </Link>

            <div className="auth-container animate-fade-in-up">
                <div className="auth-header">
                    <img src={logo} alt="SIAM Logo" className="auth-logo-img" />
                    <p className="auth-subtitle">Gələcəyi bizimlə qurun</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">E-poçt</label>
                        <div className="input-with-icon">
                            <Mail className="input-icon" size={18} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ad@misal.com"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Şifrə</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 6 simvol"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Şifrə təkrarı</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Şifrəni təkrar daxil edin"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : 'Qeydiyyatdan keç'}
                    </button>
                </form>

                <p className="auth-footer">
                    Artıq hesabınız var?{' '}
                    <Link to="/login">Daxil olun</Link>
                </p>
            </div>
        </div>
    );
}
