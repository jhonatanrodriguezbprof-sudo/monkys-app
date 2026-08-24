import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { StylistPinProvider } from './context/StylistPinContext'
import { RequireAuth, RedirectIfAuth } from './components/AuthGuard'
import ErrorBoundary from './components/ErrorBoundary'

import LandingPage from './pages/client/LandingPage'
import BookingPage from './pages/client/BookingPage'
import ConfirmationPage from './pages/client/ConfirmationPage'
import LoginPage from './pages/LoginPage'
import StylistDashboard from './pages/stylist/StylistDashboard'
import StylistPinPage from './pages/stylist/StylistPinPage'
import StylistView from './pages/stylist/StylistView'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminStylists from './pages/admin/AdminStylists'
import AdminServices from './pages/admin/AdminServices'

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <StylistPinProvider>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '16px',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: '600',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#6DC926', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <LoginPage />
              </RedirectIfAuth>
            }
          />
          <Route
            path="/stylist"
            element={
              <RequireAuth allowedRoles={['stylist', 'admin']}>
                <StylistDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminAppointments />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/stylists"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminStylists />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/services"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminServices />
              </RequireAuth>
            }
          />
          <Route path="/estilista" element={<StylistPinPage />} />
          <Route path="/estilista/dashboard" element={<StylistView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </StylistPinProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
