import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Overview = lazy(() => import('./pages/Overview'));
const LiveMap = lazy(() => import('./pages/LiveMap'));
const PotholesTable = lazy(() => import('./pages/PotholesTable'));
const PotholeDetail = lazy(() => import('./pages/PotholeDetail'));
const Repairs = lazy(() => import('./pages/Repairs'));
const InspectionRuns = lazy(() => import('./pages/InspectionRuns'));
const Admin = lazy(() => import('./pages/Admin'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium text-gray-500 animate-pulse">Initializing RoadPulse...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Dashboard Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/overview" replace />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/overview" element={
              <ProtectedRoute>
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

            <Route path="/runs" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VEHICLE_OPERATOR']}>
                <Layout><InspectionRuns /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            } />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
