# ICT Budgeting App Overview

## What This App Is

The ICT Budgeting app is a premium Abu Dhabi Government web application built to manage the full ICT budget lifecycle across ADGE and DGE teams.

It supports:

- ADGE-side planning, review, approval, allocation, and utilization
- DGE-side strategic alignment, SME review, quality check, and director review
- clarification threads across ADGE and DGE
- AI-assisted analysis, recommendations, and governance signals
- role-based dashboards, queues, project views, and workflow actions

In short, it is a government-grade budgeting and governance platform with a modern, premium UI/UX layer.

## Product Style

The app is designed as an enterprise Abu Dhabi Government platform with:

- premium, clean UI
- role-based workspaces
- interactive dashboards
- project table and card views
- entity-level tracking
- AI-highlighted insights
- responsive and dark-mode-ready design

The visual system is intentionally polished and operational, not generic admin-panel UI.

## Main Roles

### ADGE roles

- Respondent
- Reviewer
- Approver

### DGE roles

- ICT - Strategy Team
- ICT - SME Team
- ICT - Strategy Director

### Admin

- ICT Admin

Each role gets its own dashboard, project access, queue logic, and stage-based actions.

## Core Technology Stack

The current app is built with:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI primitives
- Lucide React icons
- Recharts
- ExcelJS and XLSX for exports
- Microsoft Power Apps Code App tooling
- Dataverse as the main data platform

This means the app is a modern React frontend sitting on top of Microsoft Dataverse and Power Apps runtime integration.

## Data And Platform

The app relies heavily on Microsoft Dataverse for:

- ICT budgets
- ICT budget line items
- cycles
- instances
- module configuration
- teams
- clarifications
- notifications
- AI summary records
- strategic priorities and classifications

The app also uses custom APIs and controlled assignment/sharing behavior for workflow movement.

## AI Services

The current AI implementation is centered around `Core42` response endpoints in the codebase.

Main AI-driven capabilities include:

- AI budget considerations
- AI strategic suggestions
- AI portfolio summaries
- AI quality / governance guidance
- budget copilot chat and structured analysis
- supporting document analysis and cumulative document intelligence

The app also uses OpenAI-style structured response handling patterns in parts of the AI parsing flow, but the currently implemented runtime service references in the repo point to `Core42` endpoints.

## Major Functional Areas

### 1. Role-based dashboards

Every major role has a tailored dashboard with:

- stage-aware cards
- budget insights
- queue summaries
- workflow metrics
- AI guidance blocks

### 2. Project management

Projects are available in:

- table view
- card view
- detailed edit/view form

These views adapt based on role, ownership, stage, and workflow permissions.

### 3. Workflow engine

The app supports the full lifecycle:

- planning
- ADGE review and approval
- DGE review
- strategic alignment
- SME review
- quality check
- final director review
- allocation
- utilization

### 4. Clarifications

Clarification threads support:

- ADGE internal clarification
- DGE internal clarification
- DGE to ADGE clarification
- threaded replies
- stage-aware return logic
- controlled visibility by role/team

### 5. Notifications

The app includes notification logic for both ADGE and DGE teams based on workflow actions and recipient team mapping.

## Design Character

From a website perspective, the app is:

- premium
- operational
- data-heavy but structured
- enterprise-focused
- visually consistent across roles
- AI-enhanced without making AI the whole interface

The core design language combines:

- strong left navigation
- two-column dashboard rhythm
- premium cards
- step-based progress visuals
- compact project tables
- clean status badges
- purple-tinted AI surfaces

## Overall Summary

ICT Budgeting is a full workflow and governance platform for Abu Dhabi Government ICT budgeting.

It combines:

- modern React frontend architecture
- Dataverse and Power Apps integration
- complex multi-role workflow orchestration
- AI-assisted decision support
- premium enterprise UI/UX

It is not just a budgeting form app. It is a structured end-to-end planning, review, governance, allocation, and utilization system.
