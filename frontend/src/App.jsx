import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Gamification from './pages/Gamification';
import Customers from './pages/Customers';
import CalendarPage from './pages/Calendar';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import OnboardingPage from './pages/Public/OnboardingPage';
import BookingPage from './pages/Public/BookingPage';
import CustomerPointsPage from './pages/Public/CustomerPointsPage';

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/book/:slug" element={<BookingPage />} />
                    <Route path="/points/:slug" element={<CustomerPointsPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/employees" element={<Employees />} />
                            <Route path="/gamification" element={<Gamification />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/settings" element={<Settings />} />
                            {/* Add more routes here */}
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
