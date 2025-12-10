// App.jsx
import './App.css'
import 'antd/dist/reset.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import ToastProvider from './utils/ToastProvider';
import Home from './Home';
import AdminTable from './custom_components/dashboard/AdminTable';
import MainLayout from './layouts/MainLayout';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import UpdatePasswordPage from './auth/UpdatePasswordPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no header) */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/update-password' element={<UpdatePasswordPage />} />

        {/* Protected routes with MainLayout */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/home" element={<Home />} />
          <Route path="/admin" element={<AdminTable />} />
          {/* add other protected / shared-header routes here */}
        </Route>

        {/* optional: 404 or other routes */}
      </Routes>

      <ToastProvider />
    </BrowserRouter>
  );
}

export default App;

