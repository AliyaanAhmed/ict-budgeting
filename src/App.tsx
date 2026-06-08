import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { CycleProvider } from '@/context/CycleContext'
import { InstanceProvider } from '@/context/InstanceContext'
import { QueueCountsProvider } from '@/context/QueueCountsContext'
import { RoleProvider } from '@/context/RoleContext'
import { ToastProvider } from '@/context/ToastContext'
import ApproverDashboard from '@/pages/approver/Dashboard'
import ApprovalQueue from '@/pages/approver/ApprovalQueue'
import ApproverProjects from '@/pages/approver/Projects'
import AssessmentCycles from '@/pages/admin/AssessmentCycles'
import CycleDetail from '@/pages/admin/CycleDetail'
import RespondentDashboard from '@/pages/respondent/Dashboard'
import NewProject from '@/pages/respondent/NewProject'
import ProjectDetail from '@/pages/respondent/ProjectDetail'
import RespondentProjects from '@/pages/respondent/Projects'
import ReviewerDashboard from '@/pages/reviewer/Dashboard'
import ReviewQueue from '@/pages/reviewer/ReviewQueue'
import ReviewerProjects from '@/pages/reviewer/Projects'
import SmeTeamDashboard from '@/pages/sme-team/Dashboard'
import SmeTeamReviews from '@/pages/sme-team/Reviews'
import StrategyTeamDashboard from '@/pages/strategy-team/Dashboard'
import StrategyEntityTracker from '@/pages/strategy-team/EntityTracker'
import StrategyQualityCheck from '@/pages/strategy-team/QualityCheck'
import StrategySMETracker from '@/pages/strategy-team/SMETracker'
import StrategyAlignment from '@/pages/strategy-team/StrategicAlignment'

export default function App() {
  return (
    <QueueCountsProvider>
      <RoleProvider>
        <CycleProvider>
          <InstanceProvider>
            <ToastProvider>
              <HashRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/respondent/dashboard" replace />} />
                  <Route element={<AppLayout />}>
                    <Route path="/respondent/dashboard" element={<RespondentDashboard />} />
                    <Route path="/respondent/projects" element={<RespondentProjects />} />
                    <Route path="/respondent/projects/new" element={<NewProject />} />
                    <Route path="/respondent/projects/:id" element={<ProjectDetail />} />

                    <Route path="/reviewer/dashboard" element={<ReviewerDashboard />} />
                    <Route path="/reviewer/review-queue" element={<ReviewQueue />} />
                    <Route path="/reviewer/review-queue/:id" element={<ProjectDetail />} />
                    <Route path="/reviewer/projects" element={<ReviewerProjects />} />

                    <Route path="/approver/dashboard" element={<ApproverDashboard />} />
                    <Route path="/approver/approval-queue" element={<ApprovalQueue />} />
                    <Route path="/approver/approval-queue/:id" element={<ProjectDetail />} />
                    <Route path="/approver/projects" element={<ApproverProjects />} />

                    <Route path="/strategy-team/dashboard" element={<StrategyTeamDashboard />} />
                    <Route path="/strategy-team/strategic-alignment" element={<StrategyAlignment />} />
                    <Route path="/strategy-team/entity-tracker" element={<StrategyEntityTracker />} />
                    <Route path="/strategy-team/sme-tracker" element={<StrategySMETracker />} />
                    <Route path="/strategy-team/quality-check" element={<StrategyQualityCheck />} />

                    <Route path="/sme-team/dashboard" element={<SmeTeamDashboard />} />
                    <Route path="/sme-team/reviews" element={<SmeTeamReviews />} />

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
