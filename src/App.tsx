import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RoleProvider } from '@/context/RoleContext'
import { ToastProvider } from '@/context/ToastContext'
import { QueueCountsProvider } from '@/context/QueueCountsContext'
import { CycleProvider } from '@/context/CycleContext'
import { InstanceProvider } from '@/context/InstanceContext'
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
import ApproverProjects from '@/pages/approver/Projects'

import AssessmentCycles from '@/pages/admin/AssessmentCycles'
import CycleDetail from '@/pages/admin/CycleDetail'

export default function App() {
  return (
    <QueueCountsProvider>
      <RoleProvider>
        <CycleProvider>
          {/* InstanceProvider must be inside CycleProvider and RoleProvider
              so it can watch both and re-fetch when either changes */}
          <InstanceProvider>
            <ToastProvider>
              <HashRouter>
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
                    <Route path="/approver/projects" element={<ApproverProjects />} />
                    {/* ICT Admin */}
                    <Route path="/admin/assessment-cycles" element={<AssessmentCycles />} />
                    <Route path="/admin/cycles/:id" element={<CycleDetail />} />
                  </Route>
                </Routes>
              </HashRouter>
            </ToastProvider>
          </InstanceProvider>
        </CycleProvider>
      </RoleProvider>
    </QueueCountsProvider>
  )
}
