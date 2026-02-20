import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import toast from 'react-hot-toast';


// Initial Load Critical Components
import Login from './pages/Login';
import Layout from './components/Layout';
import DebugOverlay from './components/DebugOverlay';

// Helper for auto-reload on version mismatch
const lazyWithRetry = (componentImport) =>
    lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            const component = await componentImport();
            window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // Assuming that the user is not on the latest version of the application.
                // Let's refresh the page immediately.
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
            }
            throw error;
        }
    });

// Lazy Load Pages with Retry
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Services = lazyWithRetry(() => import('./pages/Services'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const Gamification = lazyWithRetry(() => import('./pages/Gamification'));
const Customers = lazyWithRetry(() => import('./pages/Customers'));
const CalendarPage = lazyWithRetry(() => import('./pages/Calendar'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const OnboardingPage = lazyWithRetry(() => import('./pages/Public/OnboardingPage'));
const BookingPage = lazyWithRetry(() => import('./pages/Public/BookingPage'));
const ClientHome = lazyWithRetry(() => import('./pages/ClientHome'));
const CustomerPointsPage = lazyWithRetry(() => import('./pages/Public/CustomerPointsPage'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const Billing = lazyWithRetry(() => import('./pages/Billing'));
const Plans = lazyWithRetry(() => import('./pages/Plans'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const PaymentSuccess = lazyWithRetry(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazyWithRetry(() => import('./pages/PaymentFailed'));

// Barber Pages
const BarberLayout = lazyWithRetry(() => import('./pages/Barber/BarberLayout'));
const BarberDashboard = lazyWithRetry(() => import('./pages/Barber/Dashboard'));
const BarberPortfolio = lazyWithRetry(() => import('./pages/Barber/Portfolio'));

// Super Admin Pages
const SuperAdminLayout = lazyWithRetry(() => import('./layouts/SuperAdminLayout'));
const SuperAdminDashboard = lazyWithRetry(() => import('./pages/SuperAdmin/Dashboard'));
const BusinessList = lazyWithRetry(() => import('./pages/SuperAdmin/BusinessList'));
const SuperAdminPayments = lazyWithRetry(() => import('./pages/SuperAdmin/Payments'));
const SuperAdminAudit = lazyWithRetry(() => import('./pages/SuperAdmin/Audit'));
const SuperAdminRecovery = lazyWithRetry(() => import('./pages/SuperAdmin/Recovery'));

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
    // Network Status Monitoring
    React.useEffect(() => {
        const handleOffline = () => toast.error("Sin conexión a internet", { icon: '📡' });
        const handleOnline = () => toast.success("Conexión restaurada", { icon: 'lte' });

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<SplashScreen />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />
                        <Route path="/book/:slug" element={<BookingPage />} />
                        <Route path="/client" element={<ClientHome />} />
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
                <DebugOverlay />
            </AuthProvider>
        </BrowserRouter>
    );
}
export default App;
