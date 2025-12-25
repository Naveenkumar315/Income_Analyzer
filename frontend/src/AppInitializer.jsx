// AppInitializer.jsx
import { useEffect } from 'react';
import useRefreshUser from './hooks/useRefreshUser';


export default function AppInitializer({ children }) {
    const { refreshUser } = useRefreshUser();

    useEffect(() => {
        const email = sessionStorage.getItem('user_email');
        if (email) {
            refreshUser(email);
        }
    }, [refreshUser]);

    return children;
}