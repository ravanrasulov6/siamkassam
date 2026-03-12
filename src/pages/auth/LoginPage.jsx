import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/5logo.png';
import './auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Giriş zamanı xəta baş verdi');
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
                    <p className="auth-subtitle">Biznesinizə xoş gəldiniz</p>
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
                                placeholder="••••••••"
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
                        {loading ? <span className="spinner" /> : 'Daxil ol'}
                    </button>
                </form>

                <p className="auth-footer">
                    Hesabınız yoxdur?{' '}
                    <Link to="/register">Qeydiyyatdan keç</Link>
                </p>
            </div>
        </div>
    );
}
