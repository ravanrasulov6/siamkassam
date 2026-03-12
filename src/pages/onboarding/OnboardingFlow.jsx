import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import './onboarding.css';

const CATEGORIES = [
    'Telefon mağazası',
    'Market',
    'Geyim',
    'Elektronika',
    'Əczaxana',
    'Restoran',
    'Kafe',
    'Digər',
];

const SIZES = [
    { value: 'small', label: 'Kiçik' },
    { value: 'medium', label: 'Orta' },
    { value: 'large', label: 'Böyük' },
];

const TOTAL_STEPS = 5;

export default function OnboardingFlow() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        storeName: '',
        category: '',
        size: 'small',
        employeeCount: 1,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();

    // Safety: If onboarding is already completed, get out of here
    useEffect(() => {
        if (profile?.onboarding_completed) {
            navigate('/dashboard', { replace: true });
        }
    }, [profile, navigate]);

    function updateField(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError('');
    }

    function canProceed() {
        switch (step) {
            case 2:
                return formData.firstName.trim().length >= 2 && formData.lastName.trim().length >= 2;
            case 3:
                return formData.storeName.trim().length >= 2 && formData.category !== '';
            case 4:
                return formData.employeeCount >= 1;
            default:
                return true;
        }
    }

    function handleNext() {
        if (!canProceed()) {
            setError('Zəhmət olmasa bütün sahələri doldurun');
            return;
        }
        setError('');
        setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }

    function handleBack() {
        setStep((s) => Math.max(s - 1, 1));
        setError('');
    }

    async function handleComplete() {
        setLoading(true);
        setError('');

        try {
            // Update profile with all info in one go
            await updateProfile({
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                biz_name: formData.storeName.trim(),
                biz_category: formData.category,
                biz_size: formData.size,
                biz_employee_count: formData.employeeCount,
                onboarding_completed: true,
                business_id: profile?.id // The profile ID is the business ID
            });

            // Move to complete screen
            setStep(5);
        } catch (err) {
            setError(err.message || 'Xəta baş verdi. Yenidən cəhd edin.');
            setLoading(false);
        }
    }

    return (
        <div className="onboarding-page">
            {/* Progress bar */}
            {step > 1 && step < 5 && (
                <div className="progress-bar onboarding-progress">
                    {Array.from({ length: TOTAL_STEPS - 2 }, (_, i) => (
                        <div
                            key={i}
                            className={`progress-step ${i + 2 <= step ? 'active' : ''
                                } ${i + 2 < step ? 'completed' : ''}`}
                        />
                    ))}
                </div>
            )}

            <div className="onboarding-content">
                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="onboarding-step animate-fade-in-up">
                        <div className="onboarding-welcome">
                            <div className="onboarding-header">
                                <img src={logo} alt="SIAM Logo" className="onboarding-logo-img" />
                            </div>
                            <p className="onboarding-tagline">
                                Biznesinizi idarə edin.
                                <br />
                                <strong>Sadə. Sürətli. Güclü.</strong>
                            </p>
                            <p className="onboarding-desc">
                                Satış, anbar, borc takibi — hər şey bir yerdə.
                            </p>
                            <button
                                className="btn btn-primary btn-lg btn-block"
                                onClick={handleNext}
                            >
                                Başla →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Personal Info */}
                {step === 2 && (
                    <div className="onboarding-step animate-slide-right">
                        <div className="onboarding-card">
                            <h2 className="onboarding-step-title">Şəxsi Məlumatlar</h2>
                            <p className="onboarding-step-desc">
                                Sizi daha yaxşı tanıyaq
                            </p>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="firstName">Ad</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder="Adınızı daxil edin"
                                    value={formData.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Soyad</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="Soyadınızı daxil edin"
                                    value={formData.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                />
                            </div>

                            <div className="onboarding-actions">
                                <button className="btn btn-ghost" onClick={handleBack}>
                                    ← Geri
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNext}
                                    disabled={!canProceed()}
                                >
                                    Davam et →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Store Info */}
                {step === 3 && (
                    <div className="onboarding-step animate-slide-right">
                        <div className="onboarding-card">
                            <h2 className="onboarding-step-title">Mağaza Haqqında</h2>
                            <p className="onboarding-step-desc">
                                Biznesiniz haqqında məlumat verin
                            </p>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="storeName">Mağaza adı</label>
                                <input
                                    id="storeName"
                                    type="text"
                                    placeholder="Məsələn: TechStore"
                                    value={formData.storeName}
                                    onChange={(e) => updateField('storeName', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="category">Kateqoriya</label>
                                <select
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => updateField('category', e.target.value)}
                                >
                                    <option value="">Kateqoriya seçin</option>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="onboarding-actions">
                                <button className="btn btn-ghost" onClick={handleBack}>
                                    ← Geri
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNext}
                                    disabled={!canProceed()}
                                >
                                    Davam et →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Scale */}
                {step === 4 && (
                    <div className="onboarding-step animate-slide-right">
                        <div className="onboarding-card">
                            <h2 className="onboarding-step-title">Biznes Həcmi</h2>
                            <p className="onboarding-step-desc">
                                Bu məlumatlar paneli sizə uyğunlaşdırmaq üçündür
                            </p>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="size">Mağaza ölçüsü</label>
                                <select
                                    id="size"
                                    value={formData.size}
                                    onChange={(e) => updateField('size', e.target.value)}
                                >
                                    {SIZES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="employeeCount">İşçi sayı</label>
                                <input
                                    id="employeeCount"
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={formData.employeeCount}
                                    onChange={(e) =>
                                        updateField('employeeCount', parseInt(e.target.value) || 1)
                                    }
                                />
                            </div>

                            <div className="onboarding-actions">
                                <button className="btn btn-ghost" onClick={handleBack}>
                                    ← Geri
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleComplete}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="spinner" />
                                    ) : (
                                        'Tamamla ✓'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Complete */}
                {step === 5 && (
                    <div className="onboarding-step animate-scale-in">
                        <div className="onboarding-complete">
                            <div className="onboarding-check">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <circle cx="32" cy="32" r="30" stroke="#059669" strokeWidth="3" fill="#ECFDF5" />
                                    <path
                                        d="M20 32L28 40L44 24"
                                        stroke="#059669"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            strokeDasharray: 100,
                                            animation: 'checkmark 0.6s ease forwards',
                                        }}
                                    />
                                </svg>
                            </div>
                            <h2 className="onboarding-step-title">Hazırsınız! 🎉</h2>
                            <p className="onboarding-step-desc">
                                Biznesiniz uğurla qeydiyyatdan keçdi
                            </p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate('/dashboard')}
                            >
                                Dashboard-a keç →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
