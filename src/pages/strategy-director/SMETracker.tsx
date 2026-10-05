import { SMETrackerView } from '@/pages/strategy-team/SMETracker'

export default function StrategyDirectorSMETracker() {
  return (
    <SMETrackerView
      eyebrow="ICT - Strategy Director"
      description="Review classifications and monitor SME progress, clarification pressure, and completed reviews across every strategic priority."
      projectBasePath="/strategy-director/projects"
      queueHref="/strategy-director/reviewer-queue"
      queueLabel="Open Director Queue"
    />
  )
}
