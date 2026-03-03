import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { CitizenLayout } from './components/CitizenLayout';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const Overview = lazy(() => import('./pages/Overview'));
const LiveMap = lazy(() => import('./pages/LiveMap'));
const PotholesTable = lazy(() => import('./pages/PotholesTable'));
const PotholeDetail = lazy(() => import('./pages/PotholeDetail'));
const Repairs = lazy(() => import('./pages/Repairs'));
const ReviewQueue = lazy(() => import('./pages/ReviewQueue'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));

// Citizen Pages
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
  const { getHomePath } = useAuth();
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
            <Route path="/staff-login" element={<StaffLogin />} />

            {/* Public/Citizen Routes (Staff allowed for inspection) */}
            <Route path="/citizen" element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'MAINTENANCE_OFFICER']}>
                <CitizenLayout><ReportWizard /></CitizenLayout>
              </ProtectedRoute>
            } />
            <Route path="/citizen/my-reports" element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'MAINTENANCE_OFFICER']}>
                <CitizenLayout><MyReports /></CitizenLayout>
              </ProtectedRoute>
            } />
            <Route path="/citizen/status/:id" element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'MAINTENANCE_OFFICER']}>
                <CitizenLayout><ReportStatus /></CitizenLayout>
              </ProtectedRoute>
            } />

            {/* Admin Dashboard Routes */}
            <Route path="/overview" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MAINTENANCE_OFFICER']}>
                <Layout><Overview /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/map" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MAINTENANCE_OFFICER']}>
                <Layout><LiveMap /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/potholes" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MAINTENANCE_OFFICER']}>
                <Layout><PotholesTable /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/potholes/:id" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MAINTENANCE_OFFICER']}>
                <Layout><PotholeDetail /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/repairs" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MAINTENANCE_OFFICER']}>
                <Layout><Repairs /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/review-queue" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MAINTENANCE_OFFICER']}>
                <Layout><ReviewQueue /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />

            {/* Root Redirect Logic */}
            <Route path="/" element={
              <ProtectedRoute>
                <RootRedirect />
              </ProtectedRoute>
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
