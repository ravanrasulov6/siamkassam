import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import logo from '../../assets/5logo.png';
import './auth.css';

export default function LoginPage() {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'whatsapp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('request'); // 'request' or 'verify'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    async function handleEmailLogin(e) {
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

    async function handleRequestOTP(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: funcError } = await supabase.functions.invoke('whatsapp-auth-otp', {
                body: { phone, action: 'request' }
            });
            if (funcError || !data.success) throw new Error(data?.error || 'Kod göndərilə bilmədi');
            setStep('verify');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOTP(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: funcError } = await supabase.functions.invoke('whatsapp-auth-otp', {
                body: { phone, code: otp, action: 'verify' }
            });

            if (funcError || !data.success) throw new Error(data?.error || 'Kod səhvdir');

            if (data.session_link) {
                // If new user, redirect to onboarding after auth
                if (data.is_new_user) {
                    // Store flag so after magic link redirect we go to onboarding
                    localStorage.setItem('siam_new_user', 'true');
                }
                window.location.href = data.session_link;
            } else {
                throw new Error("Sessiya yaradıla bilmədi");
            }
        } catch (err) {
            setError(err.message);
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

                <div className="auth-tabs">
                    <button 
                        className={`auth-tab ${loginMethod === 'email' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('email'); setError(''); }}
                    >
                        <Mail size={16} /> E-poçt
                    </button>
                    <button 
                        className={`auth-tab ${loginMethod === 'whatsapp' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('whatsapp'); setError(''); }}
                    >
                        <MessageSquare size={16} /> WhatsApp
                    </button>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {loginMethod === 'email' ? (
                    <form onSubmit={handleEmailLogin} className="auth-form">
                        <div className="form-group">
                            <label>E-poçt</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ad@misal.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Şifrə</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Daxil ol'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={step === 'request' ? handleRequestOTP : handleVerifyOTP} className="auth-form">
                        {step === 'request' ? (
                            <div className="form-group">
                                <label>Telefon Nömrəsi</label>
                                <div className="input-with-icon">
                                    <Phone className="input-icon" size={18} />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+994 50 000 00 00"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Təsdiqləmə Kodu (OTP)</label>
                                <div className="input-with-icon">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="6 rəqəmli kod"
                                        required
                                        maxLength={6}
                                    />
                                </div>
                                <p className="resend-text" onClick={() => setStep('request')}>Kodu yenidən göndər</p>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                            {loading ? <span className="spinner" /> : (step === 'request' ? 'Kod Göndər' : 'Təsdiqlə və Daxil ol')}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Hesabınız yoxdur?{' '}
                    <Link to="/register">Qeydiyyatdan keç</Link>
                </p>
            </div>
        </div>
    );
}
