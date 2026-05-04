import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RoleProvider } from '@/context/RoleContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppLayout } from '@/components/layout/AppLayout'

import RespondentDashboard from '@/pages/respondent/Dashboard'
import RespondentProjects from '@/pages/respondent/Projects'
import NewProject from '@/pages/respondent/NewProject'
import ProjectDetail from '@/pages/respondent/ProjectDetail'

import ReviewerDashboard from '@/pages/reviewer/Dashboard'
import ReviewQueue from '@/pages/reviewer/ReviewQueue'
import ReviewerProjects from '@/pages/reviewer/Projects'

import ApproverDashboard from '@/pages/approver/Dashboard'
import ApprovalQueue from '@/pages/approver/ApprovalQueue'

export default function App() {
  return (
    <RoleProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/respondent/dashboard" replace />} />
            <Route element={<AppLayout />}>
              {/* Respondent */}
              <Route path="/respondent/dashboard" element={<RespondentDashboard />} />
              <Route path="/respondent/projects" element={<RespondentProjects />} />
              <Route path="/respondent/projects/new" element={<NewProject />} />
              <Route path="/respondent/projects/:id" element={<ProjectDetail />} />
              {/* Reviewer */}
              <Route path="/reviewer/dashboard" element={<ReviewerDashboard />} />
              <Route path="/reviewer/review-queue" element={<ReviewQueue />} />
              <Route path="/reviewer/review-queue/:id" element={<ProjectDetail />} />
              <Route path="/reviewer/projects" element={<ReviewerProjects />} />
              {/* Approver */}
              <Route path="/approver/dashboard" element={<ApproverDashboard />} />
              <Route path="/approver/approval-queue" element={<ApprovalQueue />} />
              <Route path="/approver/approval-queue/:id" element={<ProjectDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </RoleProvider>
  )
}
