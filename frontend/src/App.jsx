import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';

// Initial Load Critical Components
import Login from './pages/Login';
import Layout from './components/Layout';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Services = lazy(() => import('./pages/Services'));
const Employees = lazy(() => import('./pages/Employees'));
const Gamification = lazy(() => import('./pages/Gamification'));
const Customers = lazy(() => import('./pages/Customers'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const Settings = lazy(() => import('./pages/Settings'));
const OnboardingPage = lazy(() => import('./pages/Public/OnboardingPage'));
const BookingPage = lazy(() => import('./pages/Public/BookingPage'));
const CustomerPointsPage = lazy(() => import('./pages/Public/CustomerPointsPage'));
const Reports = lazy(() => import('./pages/Reports'));
const Billing = lazy(() => import('./pages/Billing'));
const Plans = lazy(() => import('./pages/Plans'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));

// Barber Pages
const BarberLayout = lazy(() => import('./pages/Barber/BarberLayout'));
const BarberDashboard = lazy(() => import('./pages/Barber/Dashboard'));
const BarberPortfolio = lazy(() => import('./pages/Barber/Portfolio'));

// Super Admin Pages
const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/Dashboard'));
const BusinessList = lazy(() => import('./pages/SuperAdmin/BusinessList'));
const SuperAdminPayments = lazy(() => import('./pages/SuperAdmin/Payments'));
const SuperAdminAudit = lazy(() => import('./pages/SuperAdmin/Audit'));
const SuperAdminRecovery = lazy(() => import('./pages/SuperAdmin/Recovery'));

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect Super Admins to their Dashboard (PRIORITY CHECK)
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

    // Redirect Barbers to their Dashboard
    if (user.role === 'barber') {
        return <Navigate to="/barber/dashboard" replace />;
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
                <Suspense fallback={<SplashScreen />}>
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
                                <Route path="/plans" element={<Plans />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/payment-success" element={<PaymentSuccess />} />
                                <Route path="/payment-failed" element={<PaymentFailed />} />
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
                                <Route path="payments" element={<SuperAdminPayments />} />
                                <Route path="audit" element={<SuperAdminAudit />} />
                                <Route path="recovery" element={<SuperAdminRecovery />} />
                            </Route>
                        </Route>
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
