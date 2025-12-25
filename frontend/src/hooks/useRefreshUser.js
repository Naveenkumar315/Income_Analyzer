import { useCallback } from "react";
import authApi from "../api/authApi";
import { useApp } from "../contexts/AppContext";

export default function useRefreshUser() {
    const { user, setUser } = useApp();

    const refreshUser = useCallback(async (email) => {
        const finalEmail = email || user?.email;
        if (!finalEmail) return;

        try {
            const response = await authApi.getUserByEmail({
                email: finalEmail,
            });


            // Update the SAME global user state
            setUser((prev) => ({
                ...prev,
                ...response,
            }));

            return response;
        } catch (error) {
            console.error("Failed to refresh user data", error);
        }
    }, [user, setUser]);

    return { refreshUser };
}
