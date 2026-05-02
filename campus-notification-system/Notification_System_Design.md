# Campus Notification System - Technical Design

## Overview
This document outlines the architecture and implementation of the Campus Notification System, focusing on efficient notification delivery, priority ranking, and real-time user experience.

## Core Features
1. **Global Priority Inbox**: A dedicated feed showing the Top 10 most important unread notifications across all categories.
2. **Main Notification Feed**: A paginated list of all campus updates with support for category filtering (Placements, Results, Events).
3. **Live Telemetry**: Integrated logging middleware that streams application events to a remote evaluation service for monitoring.
4. **State Persistence**: Uses browser session storage to track viewed notifications, ensuring a consistent "Unread" status across sessions.

## Priority Ranking Logic (The Scoring Engine)
To maintain the Top 10 efficiently, we use a weighted scoring algorithm:
- **Weights**: `Placement (3)` > `Result (2)` > `Event (1)`.
- **Recency Factor**: We normalize the timestamp of each notification. Newer notifications receive a higher recency score.
- **Formula**: `Final Score = (Type Weight * 100) + Normalized Recency`

This formula ensures that all Placements are ranked above Results, but within the Placement category, newer ones appear first.

## Efficient Maintenance of Top 10
Instead of re-sorting thousands of records, we:
1. Fetch the latest notifications from the API.
2. Filter for `isNew: true` (unread status).
3. Apply the scoring engine locally to the active set.
4. Update the UI state reactively when a user marks a notification as read.

## Technology Stack
- **Frontend**: Next.js 14, React, Material UI.
- **State Management**: React Hooks (useMemo, useCallback, useRef) for optimized performance.
- **API Proxy**: Server-side Next.js route handlers to securely handle authentication and bypass CORS.

## Integration Details
- **Authentication**: Bearer Token handshake with refresh logic.
- **Endpoints**: `/api/notifications` proxying to the evaluation service.
- **Telemetry**: POST-based remote logging implemented in `src/middleware/logger.ts`.
