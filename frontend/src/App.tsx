import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./pages/Home";
import { Generator } from "./pages/Generator";
import { Gallery } from "./pages/Gallery";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { UserDashboard } from "./pages/dashboards/UserDashboard";
import { AdminDashboard } from "./pages/dashboards/AdminDashboard";
import { AnalyticsDashboard } from "./pages/dashboards/AnalyticsDashboard";
import { AIModelDashboard } from "./pages/dashboards/AIModelDashboard";
import { useWebSockets } from "./hooks/useWebSockets";

const MainAppLayout: React.FC = () => {
  const location = useLocation();
  const { isConnected } = useWebSockets();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col transition-colors">
      <Navbar wsConnected={isConnected} />
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Hide sidebar on authentication page viewport scopes */}
        {!isAuthPage && <Sidebar />}
        
        <main className="flex-1 bg-zinc-50 dark:bg-brand-dark p-4 md:p-8 overflow-x-hidden min-h-[90vh]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
            <Route path="/dashboard/ai-model" element={<AIModelDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <MainAppLayout />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
