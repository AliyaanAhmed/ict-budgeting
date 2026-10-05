# ICT Budgeting Website Design Guide

## Purpose

This file documents the implemented website design patterns of the ICT Budgeting app. It is focused on the UI structure, visual behavior, and reusable page patterns across ADGE and DGE roles.

It is not a workflow or backend document. This guide is specifically for:

- layout and shell structure
- sidebar behavior
- dashboard composition
- entity tracker stepper and stage progress design
- card patterns
- project table view and card view design
- responsive behavior
- dark mode behavior

## Design Direction

The app uses a government-grade, clean enterprise design language with a modern product feel.

Core characteristics:

- white and soft-blue surfaces in light mode
- deep navy slate surfaces in dark mode
- primary action color built around `#286CFF`
- rounded cards and containers, but not overly soft
- strong border usage with light blue-gray dividers
- subtle elevation instead of heavy shadows
- dense information layout without looking crowded
- clear role-based navigation and page separation
- AI components visually differentiated using a purple-tinted treatment

The UI avoids flashy gradients for standard business cards. Gradients are mostly reserved for AI summary sections and a few premium highlight areas.

## Global Layout

The main shell is composed of:

1. left fixed sidebar
2. top header
3. scrollable page content area

The sidebar is fixed and collapsible. The main content shifts based on sidebar width.

### Sidebar

Source of truth:

- `src/components/layout/Sidebar.tsx`
- `src/components/layout/AppLayout.tsx`

Implemented behavior:

- fixed left vertical navigation
- two widths:
  - expanded: `248px`
  - collapsed: `72px`
- floating edge toggle button
- app logo block at the top
- role-specific navigation items
- user identity block at the bottom in expanded mode
- navigation content has its own scroll
- footer area does not scroll with nav items

### Sidebar Visual Style

- background uses app surface token
- border on the outer edge
- active item uses solid primary blue background with white text
- inactive items use muted foreground and subtle hover background
- nav items use compact rounded rectangles, not pills
- queue badges appear at the far right in expanded mode
- collapsed mode shows icons only with tooltip titles

### Sidebar Navigation Structure

Navigation changes based on active role.

Examples:

- Respondent: Dashboard, My Projects, New Project
- Reviewer: Dashboard, Review Queue, Projects
- Approver: Dashboard, Approval Queue, Projects
- ICT Admin: Assessment Cycle
- ICT - Strategy Team: Dashboard, Projects, Strategic Alignment, Entity Tracker, SME Tracker, Quality Check
- ICT - Strategy Director: Dashboard, Projects, Director Review Queue, Entity Tracker
- ICT - SME Team: Dashboard, Projects, SME Review Queue

## Header

The top header works as the app control strip.

Common responsibilities:

- role switch
- cycle switch
- notifications
- global user context
- quick workspace context

The header is intentionally lighter than the sidebar and should not overpower page content.

## Dashboard Design Pattern

Dashboards across roles follow the same structural philosophy:

1. context / hero section
2. action or metric cards
3. budget or workflow insight cards
4. operational charts or queue components
5. AI summary or recommendation component

### Dashboard Grid

Most dashboard sections are arranged in:

- 2 components per row on desktop
- stacked layout on small screens

Action-card strips can use:

- 3 cards in a row
- 4 cards in a row
- responsive wrapping on smaller breakpoints

The app prefers balanced rows rather than one oversized and one tiny panel unless the content clearly needs it.

### Metric / Action Cards

These are the small highlight cards that show counts or immediate actions.

Common traits:

- rounded corners around `24px`
- bordered surface
- white or lightly tinted background
- icon on the right or top-right
- title can break into two lines for readability
- badge pill below or near the value
- hover lift is subtle

Card content hierarchy:

- title
- large numeric value
- supporting badge
- short description

These cards often also navigate to queue or project pages with a preselected filter.

## Standard Card Language

Most cards in the app follow one of these patterns.

### 1. Business Card

Used for dashboards, summaries, trackers, and operational panels.

Visual traits:

- white background
- blue-gray border
- soft shadow
- rounded `24px` to `28px`
- header with icon and title
- compact content blocks

### 2. Tinted Insight Card

Used for light-emphasis content inside larger business cards.

Visual traits:

- very light blue or slate tint
- lighter border
- smaller radius like `18px` to `20px`
- often used for metrics, totals, and sub-panels

### 3. AI Card

Used only for AI-generated or AI-guided content.

Visual traits:

- purple-tinted border and surface
- top gradient or tinted wash
- `Sparkles` icon in a circular purple badge
- explanation-oriented content
- accordion behavior in many places

AI cards should remain visually distinct from standard workflow cards.

## Entity Tracker Design

Primary references:

- `src/pages/strategy-team/EntityTracker.tsx`
- `src/pages/strategy-director/EntityTracker.tsx`

Entity Tracker is one of the most important visual patterns in the app.

Each entity card is designed as a full-width governance summary block with:

1. entity heading area
2. metrics row
3. stepper-style stage progress
4. segmented stage distribution bar
5. AI or portfolio insight section
6. action button area

### Stepper-Style Progress

The entity tracker does not use a generic plain progress bar only. It uses a stage stepper with icons.

Stages:

1. Planning
2. DGE Review
3. Review Completed
4. Allocation
5. Utilization

Each step:

- has a circular icon container
- uses active vs upcoming visual states
- is connected with a horizontal line
- shows label and small state text below

Implemented step icons:

- Planning: `Clock3`
- DGE Review: `Route`
- Review Completed: `CircleCheckBig`
- Allocation: `Waypoints`
- Utilization: `ArrowRight`

### Stepper Visual Rules

- active and completed steps use solid primary blue background
- upcoming steps use light neutral background
- connectors fill progressively
- label text stays readable and compact
- the entire stepper is horizontally scroll-safe on smaller screens

### Stage Progress Segmented Bar

Below the stepper, each entity card shows a segmented distribution bar for project status mix.

Segments:

- Planning
- DGE Review
- Review Completed
- Allocation
- Utilization

Implemented color intent:

- Planning: dark teal
- DGE Review: blue
- Review Completed: violet
- Allocation: orange
- Utilization: slate

Rules:

- counts can appear inside segments when non-zero
- all segments stay within one shared horizontal bar
- legend items appear below with color dot and count
- segment colors are strong, not faded low-opacity washes

## Dashboard Charts

Dashboards use charts carefully and usually combine them with numbers rather than relying on charts alone.

Typical chart forms:

- segmented bars
- compact horizontal progress bars
- stacked budget bars
- donut or pie charts in selected places
- distribution rows with amount labels and share

Charts should not feel decorative. They should always support a workflow decision.

## Project Screen Design

Primary references:

- `src/components/shared/ProjectTable.tsx`
- `src/pages/respondent/Projects.tsx`
- `src/pages/reviewer/Projects.tsx`
- `src/pages/approver/Projects.tsx`
- `src/pages/dge-projects/Projects.tsx`

Project screens are designed with two switchable view modes:

1. table view
2. card view

This is a core app pattern and should remain consistent across roles.

## Project Page Header Area

The top of project pages typically contains:

- page title
- cycle name
- optional page description
- filter tabs with counts
- search
- dropdown filters
- export button
- table/card view toggle

### Filter Tabs

Implemented tab style:

- rounded full pills
- active state uses solid primary background and white text
- inactive state uses white background with border
- count chip appears inside each tab

These tabs are role- and phase-aware. They change based on the current queue or instance stage.

## Table View Design

The table is designed to be information-dense but readable.

### Table Behavior

- bordered white container
- rounded outer shell
- scroll-safe horizontally when needed
- sortable and filterable via column logic
- header labels do not wrap unnecessarily
- row links open project detail pages

### Common Table Columns

Depending on role and stage, the table can show:

- Ref ID
- Project Name
- AI Score
- Strategic Priority
- Classification
- Requested Budget
- Recommended Budget
- Allocated Budget
- Utilized Budget
- Planning Outcome
- Added In Allocation
- Status
- Pending With
- Created By

### Budget Column Strategy

Budget columns are condition-based for ADGE screens and always broader for DGE screens.

ADGE instance-based reveal:

- Planning: Requested only
- Review Completed by DGE: Requested + Recommended
- Allocation: Requested + Recommended + Allocated
- Utilization: Requested + Recommended + Allocated + Utilized

DGE project pages:

- always show the full DGE-level budget set

### Table Design Details

- budget headers use a dirham icon in the header only
- cell values use dark readable text
- status badges stay on one line
- strategic priority and classification are shown as plain readable text, not muted placeholders
- table rows are designed for quick scanning rather than heavy decorative styling

## Card View Design

Card view is the more visual alternative to table view.

### Card Structure

Each project card usually contains:

1. top meta row
2. project title
3. status badges
4. strategic priority / classification block
5. budget summary tiles
6. footer with submitted by or pending with
7. action link

### Card Visual Language

- rounded around `20px` to `24px`
- white surface
- light blue border
- hover lift with stronger blue border
- compact inner spacing
- clear primary CTA at the bottom-right

### DGE Project Cards

DGE project cards emphasize:

- DGE status tag
- AI score
- strategic priority and classification
- all four budget types
- pending with

### ADGE Project Cards

ADGE project cards are instance-aware and reveal budget metrics progressively based on instance phase.

## Budget Tiles Inside Cards

Small budget tiles inside project cards use:

- very light blue background
- no excessive shadow
- short label
- bold amount

They are designed as compact data tiles, not as fully independent cards.

## Empty States

The app uses deliberate empty states rather than just blank spaces.

Common principles:

- centered composition
- icon-led messaging
- supportive title and description
- role-aware wording
- optional action CTA

Dashboard sub-components also use inline empty states for no data scenarios. These should feel part of the card rather than a page-level failure.

## Skeleton Loading

The app prefers skeleton loading over raw spinners for content-heavy pages.

Used especially on:

- dashboards
- strategy pages
- entity tracker
- project cards and list areas

Skeletons mimic final layout blocks:

- title bars
- icon circles
- metric tiles
- chart areas
- content cards

This keeps perceived performance smooth and prevents layout jumping.

## Dark Mode

Dark mode is fully considered in the design system.

Common rules:

- white surfaces become navy/slate panels
- borders shift to `white/10`
- text remains high contrast
- tints remain visible but softened
- AI purple treatments remain distinct in dark mode

Important:

- dark mode should not invert hierarchy
- accent colors should remain meaningful
- hover states should still feel clear

## Spacing and Radius Rules

Typical radius values in the app:

- shell cards: `24px` to `28px`
- nested panels: `18px` to `20px`
- pills and tags: fully rounded
- toggle groups: `8px` to `12px`

Spacing principles:

- generous outer card padding
- tighter internal metric grouping
- consistent `gap-2`, `gap-3`, `gap-4`, `gap-5`
- two-up dashboard row spacing should feel even

## Typography Rules

Implemented typography is enterprise-clean and strong on hierarchy.

Patterns:

- page title: bold, large, dark
- section title: strong semibold or bold
- metric values: large and prominent
- body helper text: muted slate
- labels: compact and readable
- avoid unnecessary uppercase in primary UI headings

Status and metadata should stay small, but not so small that readability suffers.

## Interaction Principles

The app is designed around clear workflow interactions.

Patterns:

- click-through action cards on dashboards
- tab filters that update project or queue state
- table/card toggles
- accordion AI summaries
- inline hover elevation on cards
- confirm dialogs before major workflow actions
- toast feedback after actions

The UI should always help the user understand what stage they are in and what action is expected next.

## AI Component Treatment

AI components should remain visually separate from standard workflow UI.

Common traits:

- purple badge icon with `Sparkles`
- light purple gradient or top tint
- rounded premium container
- summary-first writing
- optional expand/collapse behavior

AI styling should not be reused for non-AI business logic cards.

## Recommended Reuse Rules

When creating new screens or components, follow these rules:

- reuse the sidebar shell and content width behavior
- keep dashboard sections in 2-up rows where practical
- use standard business cards for workflow content
- use AI tint only for actual AI features
- use the entity tracker stepper pattern for lifecycle progression
- keep project table and project card structures aligned across roles
- keep DGE project pages visually parallel to ADGE project pages
- reveal budget fields by stage where the app already follows stage-based logic

## Reference Files

Use these files as implementation references:

- `src/components/layout/Sidebar.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/shared/ProjectTable.tsx`
- `src/pages/respondent/Projects.tsx`
- `src/pages/reviewer/Projects.tsx`
- `src/pages/approver/Projects.tsx`
- `src/pages/dge-projects/Projects.tsx`
- `src/pages/strategy-team/EntityTracker.tsx`
- `src/pages/strategy-director/EntityTracker.tsx`

## Summary

The ICT Budgeting app design system is built around:

- a strong left navigation shell
- role-based dashboards with two-up card rows
- compact but premium business cards
- visually clear status and budget progression
- stepper-driven entity lifecycle tracking
- dual-mode project browsing through table and card views
- careful dark mode support
- a distinct AI visual language

Any future UI work should extend these patterns rather than inventing a separate visual system.
