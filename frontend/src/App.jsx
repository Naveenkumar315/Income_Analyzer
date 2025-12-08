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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no header) */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Routes that should show Header are nested under MainLayout */}
        <Route element={<MainLayout />}>
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
