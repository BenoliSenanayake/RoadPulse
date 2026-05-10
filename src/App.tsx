import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { CitizenLayout } from './components/CitizenLayout';
import { StaffLayout } from './components/StaffLayout';
import { AdminLayout } from './components/AdminLayout';

// Citizen pages
import CitizenHome from './pages/citizen/CitizenHome';
import ReportWizard from './pages/citizen/ReportWizard';
import MyReports from './pages/citizen/MyReports';
import ReportStatus from './pages/citizen/ReportStatus';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';

// Staff pages
import StaffLogin from './pages/StaffLogin';
import MaintenanceOverview from './pages/MaintenanceOverview';
import LiveMap from './pages/LiveMap';
import ReportMaintenanceHistory from './pages/ReportMaintenanceHistory';
import FilteredReportList from './pages/FilteredReportList';
import StaffReportDetail from './pages/StaffReportDetail';

// Admin pages
import Overview from './pages/Overview';
import AdminReports from './pages/AdminReports';
import AdminReportDetail from './pages/AdminReportDetail';
import ProvinceMonitoring from './pages/ProvinceMonitoring';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

// ==========================================
// ERROR BOUNDARY — prevents blank screen on crash
// ==========================================
interface ErrorBoundaryState { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[RoadPulse ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    fontFamily: 'system-ui, sans-serif',
                    background: '#0f172a',
                    color: 'white',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem'
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>RoadPulse — Render Error</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        A component failed to render. Check the browser console for details.
                    </p>
                    <pre style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.7rem',
                        maxWidth: '600px',
                        overflow: 'auto',
                        color: '#f87171'
                    }}>
                        {this.state.error?.message}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ==========================================
// PORTAL MODE (resolved once at module load)
// ==========================================
const portalMode = (import.meta.env.VITE_PORTAL_MODE || 'citizen').toLowerCase();

// ==========================================
// CITIZEN PORTAL ROUTES
// ==========================================
const CitizenApp = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/citizen" replace />} />

        {/* Public */}
        <Route path="/citizen" element={<CitizenLayout><CitizenHome /></CitizenLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Redirect legacy citizen sub-paths */}
        <Route path="/citizen/login" element={<Navigate to="/login" replace />} />
        <Route path="/citizen/signup" element={<Navigate to="/signup" replace />} />

        {/* Protected citizen routes */}
        <Route
            path="/citizen/report"
            element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenLayout hideFooter><ReportWizard /></CitizenLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/citizen/my-reports"
            element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenLayout><MyReports /></CitizenLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/citizen/status/:id"
            element={
                <CitizenLayout hideFooter><ReportStatus /></CitizenLayout>
            }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/citizen" replace />} />
    </Routes>
);

// ==========================================
// STAFF PORTAL ROUTES
// ==========================================
const StaffApp = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/staff/login" replace />} />

        {/* Public */}
        <Route path="/staff/login" element={<StaffLogin />} />

        {/* Protected staff routes */}
        <Route
            path="/staff/overview"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><MaintenanceOverview /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/map"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><LiveMap /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/report-history"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><ReportMaintenanceHistory /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/verified"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><FilteredReportList /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/manual-review"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><FilteredReportList /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/in-progress"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><FilteredReportList /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/completed"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><FilteredReportList /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/overdue"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><FilteredReportList /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/rejected"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><FilteredReportList /></StaffLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/staff/reports/:id"
            element={
                <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                    <StaffLayout><StaffReportDetail /></StaffLayout>
                </ProtectedRoute>
            }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/staff/login" replace />} />
    </Routes>
);

// ==========================================
// ADMIN PORTAL ROUTES
// ==========================================
const AdminApp = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Public */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected admin routes */}
        <Route
            path="/admin/overview"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><Overview /></AdminLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/reports"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><AdminReports /></AdminLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/reports/:id"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><AdminReportDetail /></AdminLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/provinces"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><ProvinceMonitoring /></AdminLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/users"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><Users /></AdminLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/audit-logs"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><AuditLogs /></AdminLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/settings"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout><Settings /></AdminLayout>
                </ProtectedRoute>
            }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
);

// ==========================================
// ROOT APP — selects portal by mode
// ==========================================
const PortalRouter = () => {
    switch (portalMode) {
        case 'staff':  return <StaffApp />;
        case 'admin':  return <AdminApp />;
        case 'citizen':
        default:       return <CitizenApp />;
    }
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <PortalRouter />
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
