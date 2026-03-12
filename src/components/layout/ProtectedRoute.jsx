import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requireBusiness = false }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    // If auth is done but user is missing → login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated but no business + requireBusiness → onboarding
    if (requireBusiness && !profile?.onboarding_completed) {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
}
