// App.jsx
import './App.css'
import 'antd/dist/reset.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import ToastProvider from './utils/ToastProvider';
import Home from './Home';
import MainLayout from './layouts/MainLayout';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import UpdatePasswordPage from './auth/UpdatePasswordPage';
import SSOCallback from './auth/SSOCallback';
import AdminTable from './custom_components/dashboard/AdminTable';
import AppInitializer from './AppInitializer';
import IncomeAnalyzerHome from './income_analyzer/IncomeAnalyzerHome.jsx';
import Rule from './rules/Rule.jsx';

function App() {

  return (
    <AppInitializer>
      <BrowserRouter>
        <Routes>
          {/* Public routes (no header) */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/update-password' element={<UpdatePasswordPage />} />
          <Route path="/sso" element={<SSOCallback />} />

          {/* Protected routes with MainLayout */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/income-analyzer" element={<IncomeAnalyzerHome />} />
            <Route path="/rules" element={<Rule />} />
            <Route path="/users" element={<AdminTable />} />
          </Route>

          {/* optional: 404 or other routes */}
        </Routes>

        <ToastProvider />
      </BrowserRouter>
    </AppInitializer>
  );
}

export default App;

