import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ConfigProvider } from './context/ConfigContext'
import { IssueProvider } from './context/IssueContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { UserDashboard } from './pages/user/Dashboard'
import { ReportIssue } from './pages/user/ReportIssue'
import { MyIssues } from './pages/user/MyIssues'
import { NearbyIssues } from './pages/user/NearbyIssues'
import { Heatmap } from './pages/Heatmap'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminIssues } from './pages/admin/AdminIssues'
import { AdminIssueDetail } from './pages/admin/AdminIssueDetail'
import { AdminValidation } from './pages/admin/AdminValidation'
import { AdminNotifications } from './pages/admin/AdminNotifications'
import { UploadHistory } from './pages/UploadHistory'
import { ChatHistory } from './pages/ChatHistory'
import { Notifications } from './pages/Notifications'

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <IssueProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute role="citizen">
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute role="citizen">
                    <ReportIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-issues"
                element={
                  <ProtectedRoute role="citizen">
                    <MyIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nearby"
                element={
                  <ProtectedRoute role="citizen">
                    <NearbyIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/heatmap"
                element={
                  <ProtectedRoute>
                    <Heatmap />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/uploads"
                element={
                  <ProtectedRoute>
                    <UploadHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat-history"
                element={
                  <ProtectedRoute>
                    <ChatHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/issues"
                element={
                  <ProtectedRoute role="admin">
                    <AdminIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/issues/:id"
                element={
                  <ProtectedRoute role="admin">
                    <AdminIssueDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/validation"
                element={
                  <ProtectedRoute role="admin">
                    <AdminValidation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute role="admin">
                    <AdminNotifications />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </IssueProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  )
}
