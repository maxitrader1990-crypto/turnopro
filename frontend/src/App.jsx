import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import Reports from './pages/Reports';

import BarberLayout from './pages/Barber/BarberLayout';
import BarberDashboard from './pages/Barber/Dashboard';
import BarberPortfolio from './pages/Barber/Portfolio';

import Billing from './pages/Billing';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import BusinessList from './pages/SuperAdmin/BusinessList';

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Safety check: specific to this app logic
    // If user is logged in but has no business profile, redirect to onboarding
    if (!user.business_id) {
        return <Navigate to="/onboarding" replace />;
    }

    // Redirect Barbers to their Dashboard
    if (user.role === 'barber') {
        return <Navigate to="/barber/dashboard" replace />;
    }

    // Redirect Super Admins to their Dashboard
    if (user.isSuperAdmin) {
        // Only redirect if they are NOT trying to access /superadmin routes
        // But ProtectedRoute wraps /dashboard... 

        // If they are visiting /dashboard, send them to /superadmin/dashboard
        if (location.pathname === '/dashboard' || location.pathname === '/') {
            return <Navigate to="/superadmin/dashboard" replace />;
        }
        // If they are accessing other protected routes (like settings?), allow if they have business.
        // If they don't have business, and trying to access /services, they get blocked below.
    }

    // Safety check: specific to this app logic
    // If user is logged in but has no business profile, redirect to onboarding
    if (!user.business_id) {
        // If Super Admin, allow them to pass? OR redirect to superadmin dashboard?
        if (user.isSuperAdmin) {
            return <Navigate to="/superadmin/dashboard" replace />;
        }
        return <Navigate to="/onboarding" replace />;
    }

    // Subscription Check
    if (user.role === 'admin' && user.subscription) {
        const isExpired = user.subscription.status === 'expired' || user.subscription.daysRemaining <= 0;
        // Allow access only to Billing if expired
        if (isExpired && location.pathname !== '/settings/billing') {
            return <Navigate to="/settings/billing" replace />;
        }
    }

    return <Outlet />;
};

// Barber Route Wrapper
const BarberRoute = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'barber') return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};

// Super Admin Route Wrapper
const SuperAdminRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user || !user.isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
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

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/employees" element={<Employees />} />
                            <Route path="/gamification" element={<Gamification />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/settings/billing" element={<Billing />} />
                        </Route>
                    </Route>

                    {/* Barber Routes */}
                    <Route element={<BarberRoute />}>
                        <Route path="/barber" element={<BarberLayout />}>
                            <Route index element={<Navigate to="/barber/dashboard" replace />} />
                            <Route path="dashboard" element={<BarberDashboard />} />
                            <Route path="portfolio" element={<BarberPortfolio />} />
                        </Route>
                    </Route>

                    {/* Super Admin Routes */}
                    <Route element={<SuperAdminRoute />}>
                        <Route path="/superadmin" element={<SuperAdminLayout />}>
                            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
                            <Route path="dashboard" element={<SuperAdminDashboard />} />
                            <Route path="businesses" element={<BusinessList />} />
                            {/* More routes coming soon */}
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
