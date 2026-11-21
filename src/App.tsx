import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/hooks/useAuth'

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { ProfessionalLayout } from '@/components/layout/ProfessionalLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'

// Guards
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

// Public pages
import { LandingPage } from '@/pages/public/LandingPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { ServicesPage } from '@/pages/public/ServicesPage'
import { LoginPage } from '@/pages/public/LoginPage'
import { RegisterPage } from '@/pages/public/RegisterPage'

// Customer pages
import { CustomerDashboard } from '@/pages/customer/CustomerDashboard'
import { FindProfessionalsPage } from '@/pages/customer/FindProfessionalsPage'
import { ProfessionalDetailPage } from '@/pages/customer/ProfessionalDetailPage'
import { CustomerRequestsPage } from '@/pages/customer/CustomerRequestsPage'
import { CustomerRequestDetailPage } from '@/pages/customer/CustomerRequestDetailPage'
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage'

// Professional pages
import { ProfessionalDashboard } from '@/pages/professional/ProfessionalDashboard'
import { ProfessionalProfilePage } from '@/pages/professional/ProfessionalProfilePage'
import { ProfessionalRequestsPage } from '@/pages/professional/ProfessionalRequestsPage'
import { ProfessionalRequestDetailPage } from '@/pages/professional/ProfessionalRequestDetailPage'
import { ProfessionalReviewsPage } from '@/pages/professional/ProfessionalReviewsPage'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminVerificationPage } from '@/pages/admin/AdminVerificationPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* ── Customer ── */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CustomerDashboard />} />
              <Route path="find" element={<FindProfessionalsPage />} />
              <Route path="professionals/:id" element={<ProfessionalDetailPage />} />
              <Route path="requests" element={<CustomerRequestsPage />} />
              <Route path="requests/:id" element={<CustomerRequestDetailPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
            </Route>

            {/* ── Professional ── */}
            <Route
              path="/pro"
              element={
                <ProtectedRoute requiredRole="professional">
                  <ProfessionalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfessionalDashboard />} />
              <Route path="profile" element={<ProfessionalProfilePage />} />
              <Route path="requests" element={<ProfessionalRequestsPage />} />
              <Route path="requests/:id" element={<ProfessionalRequestDetailPage />} />
              <Route path="reviews" element={<ProfessionalReviewsPage />} />
              <Route path="availability" element={<ProfessionalProfilePage />} />
            </Route>

            {/* ── Admin ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
