// ProtectedRoute.jsx - Updated debugging
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/authService';

export default function ProtectedRoute({ children }) {
    const authenticated = isAuthenticated();
    if (!authenticated) {
        return <Navigate to="/" replace />;
    }

    // Render children if authenticated
    return children;
}