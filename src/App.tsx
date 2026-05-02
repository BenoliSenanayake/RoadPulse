import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CitizenLayout } from './components/CitizenLayout';
import { StaffLayout } from './components/StaffLayout';
import { AdminLayout } from './components/AdminLayout';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const Overview = lazy(() => import('./pages/Overview'));
const MaintenanceOverview = lazy(() => import('./pages/MaintenanceOverview'));
const LiveMap = lazy(() => import('./pages/LiveMap'));
const PotholeDetail = lazy(() => import('./pages/PotholeDetail'));

const Repairs = lazy(() => import('./pages/Repairs'));
const ReviewQueue = lazy(() => import('./pages/ReviewQueue'));
const FilteredReportList = lazy(() => import('./pages/FilteredReportList'));
const ReportMaintenanceHistory = lazy(() => import('./pages/ReportMaintenanceHistory'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));

// Citizen Pages
const CitizenHome = lazy(() => import('./pages/citizen/CitizenHome'));
const ReportWizard = lazy(() => import('./pages/citizen/ReportWizard'));
const MyReports = lazy(() => import('./pages/citizen/MyReports'));
const ReportStatus = lazy(() => import('./pages/citizen/ReportStatus'));
const Offline = lazy(() => import('./pages/Offline'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing System...</p>
    </div>
  </div>
);

const RootRedirect = () => {
  const { getHomePath, isAuthenticated, user } = useAuth();
  if (!user || !isAuthenticated) {
      return <Navigate to="/citizen" replace />;
  }
  return <Navigate to={getHomePath()} replace />;
};



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/staff/login" element={<StaffLogin />} />

            {/* Citizen Routes */}
            <Route path="/citizen" element={
                <CitizenLayout hideFooter><CitizenHome /></CitizenLayout>
            } />
            <Route path="/citizen/report" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenLayout><ReportWizard /></CitizenLayout>
              </ProtectedRoute>
            } />
            <Route path="/citizen/my-reports" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenLayout><MyReports /></CitizenLayout>
              </ProtectedRoute>
            } />
            <Route path="/citizen/status/:id" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenLayout><ReportStatus /></CitizenLayout>
              </ProtectedRoute>
            } />

            {/* Staff Routes */}
            <Route path="/staff/overview" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                <StaffLayout><MaintenanceOverview /></StaffLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff/map" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                <StaffLayout><LiveMap /></StaffLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff/review-queue" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                <StaffLayout><ReviewQueue /></StaffLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff/repairs" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
                <StaffLayout><Repairs /></StaffLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/staff/reports/:filter" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER', 'ADMIN']}>
                <StaffLayout><FilteredReportList /></StaffLayout>
              </ProtectedRoute>
            } />

            <Route path="/staff/report-history" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER', 'ADMIN']}>
                <StaffLayout><ReportMaintenanceHistory /></StaffLayout>
              </ProtectedRoute>
            } />

            <Route path="/potholes/:id" element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER', 'ADMIN']}>
                <StaffLayout><PotholeDetail /></StaffLayout>
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/overview" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><Overview /></AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><Admin /></AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><AuditLogs /></AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout><Settings /></AdminLayout>
              </ProtectedRoute>
            } />

            {/* Root Redirect Logic */}
            <Route path="/" element={
              <RootRedirect />
            } />

            <Route path="/offline" element={<Offline />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
