// SSOCallback.jsx - With useRef to prevent double execution
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authApi from "../api/authApi";
import { setTokens } from "../utils/authService";

export default function SSOCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Processing...");
    const hasProcessed = useRef(false); // This prevents double execution

    useEffect(() => {
        // Skip if already processed (handles StrictMode double mount)
        if (hasProcessed.current) {
            return;
        }
        hasProcessed.current = true; // Mark as processed immediately

        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) {
            toast.error("Invalid SSO response");
            navigate("/");
            return;
        }

        setStatus("Exchanging token...");

        authApi.ssoExchange({ token })
            .then(res => {
                setTokens(res.access_token, res.refresh_token, {
                    email: res.email,
                    role: res.role,
                    user_id: res.user_id,
                    username: res.username
                });

                setStatus("Redirecting...");
                navigate("/dashboard", { replace: true });
            })
            .catch((err) => {
                console.error("SSO exchange failed:", err);
                toast.error("SSO login failed");
                navigate("/");
            });

    }, [navigate]);

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="text-center">
                <span className="text-gray-500 text-sm block mb-2">
                    Signing you in with Microsoft…
                </span>
                <span className="text-gray-400 text-xs">{status}</span>
            </div>
        </div>
    );
}