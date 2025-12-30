// NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-bold mb-2">404</h1>
            <p className="text-lg mb-6">Page not found</p>

            <Link
                to="/"
                className="text-blue-600 underline"
            >
                Go to Login
            </Link>
        </div>
    );
}
