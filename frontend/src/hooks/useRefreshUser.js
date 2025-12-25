import { useCallback } from "react";
import authApi from "../api/authApi";
import { useApp } from "../contexts/AppContext";

export default function useRefreshUser() {
    const { setUser } = useApp();

    // Removed 'user' from dependencies to avoid circular updates
    const refreshUser = useCallback(async (email) => {
        if (!email) {
            console.warn("refreshUser called without email");
            return null;
        }

        try {
            const response = await authApi.getUserByEmail({ email });
            const userData = response.user || response;

            setUser(userData);
            return userData;
        } catch (error) {
            console.error("Failed to refresh user data", error);
            return null;
        }
    }, [setUser]); // Only setUser dependency

    return { refreshUser };
}