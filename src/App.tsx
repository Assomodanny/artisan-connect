import { MotionConfig } from 'motion/react'
import { Route, Routes } from 'react-router'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/routing/ProtectedRoute'
import AcceptedJobs from './pages/artisan/AcceptedJobs'
import ArtisanDashboard from './pages/artisan/ArtisanDashboard'
import ArtisanJobDetails from './pages/artisan/ArtisanJobDetails'
import ArtisanProfileEditor from './pages/artisan/ArtisanProfileEditor'
import AvailableJobs from './pages/artisan/AvailableJobs'
import Earnings from './pages/artisan/Earnings'
import MyApplications from './pages/artisan/MyApplications'
import MyReviews from './pages/artisan/MyReviews'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerProfileEditor from './pages/customer/CustomerProfileEditor'
import JobDetails from './pages/customer/JobDetails'
import MyJobs from './pages/customer/MyJobs'
import PayJob from './pages/customer/PayJob'
import PostJob from './pages/customer/PostJob'
import ArtisanProfilePage from './pages/public/ArtisanProfilePage'
import FindArtisans from './pages/public/FindArtisans'
import HowItWorksPage from './pages/public/HowItWorksPage'
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import NotFound from './pages/public/NotFound'
import Register from './pages/public/Register'
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard'
import NotificationsPage from './pages/shared/NotificationsPage'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route element={<AppShell />}>
          {/* Public pages */}
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="artisans/:artisanId" element={<ArtisanProfilePage />} />
          <Route path="artisans" element={<FindArtisans />} />

          {/* Customer area (the last route also guards unknown addresses under /customer) */}
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="customer/dashboard" element={<CustomerDashboard />} />
            <Route path="customer/notifications" element={<NotificationsPage />} />
            <Route path="customer/profile" element={<CustomerProfileEditor />} />
            <Route path="customer/jobs/new" element={<PostJob />} />
            <Route path="customer/jobs/:jobId/pay" element={<PayJob />} />
            <Route path="customer/jobs/:jobId" element={<JobDetails />} />
            <Route path="customer/jobs" element={<MyJobs />} />
            <Route path="customer/*" element={<NotFound />} />
          </Route>

          {/* Artisan area */}
          <Route element={<ProtectedRoute allowedRoles={['artisan']} />}>
            <Route path="artisan/dashboard" element={<ArtisanDashboard />} />
            <Route path="artisan/notifications" element={<NotificationsPage />} />
            <Route path="artisan/profile" element={<ArtisanProfileEditor />} />
            <Route path="artisan/jobs/:jobId" element={<ArtisanJobDetails />} />
            <Route path="artisan/jobs" element={<AvailableJobs />} />
            <Route path="artisan/applications" element={<MyApplications />} />
            <Route path="artisan/active" element={<AcceptedJobs />} />
            <Route path="artisan/earnings" element={<Earnings />} />
            <Route path="artisan/reviews" element={<MyReviews />} />
            <Route path="artisan/*" element={<NotFound />} />
          </Route>

          {/* Demo reviewer area */}
          <Route element={<ProtectedRoute allowedRoles={['reviewer']} />}>
            <Route path="reviewer/dashboard" element={<ReviewerDashboard />} />
            <Route path="reviewer/*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MotionConfig>
  )
}