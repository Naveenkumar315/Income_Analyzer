import './App.css'
import 'antd/dist/reset.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import ToastProvider from './utils/ToastProvider';
import Home from './Home';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<Home />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}

      </Routes>
      <ToastProvider />
    </BrowserRouter>
  )
}

export default App
