# Campus Notification System - Technical Design

## Overview
This is a quick breakdown of how I built the Campus Notification System for the assessment. My main focus was on making sure the priority inbox logic was solid, the UI was responsive, and that the required telemetry logging worked perfectly with the remote evaluation server.

## Features I Implemented
1. **Priority Inbox**: Shows the top 10 most important notifications across all categories so students don't miss urgent placement updates.
2. **Main Feed**: A standard paginated list of all notifications where you can easily filter by category.
3. **Telemetry Logger**: A custom middleware I built to silently send my frontend events back to the evaluation server to meet the assessment criteria, since `console.log` is restricted.
4. **Session Tracking**: I used `sessionStorage` to keep track of which notifications you've already clicked. This ensures they stay marked as "read" even if you refresh the page.

## The Priority Scoring Logic
To keep the "Top 10" list accurate and fast, I wrote a custom ranking function in `src/lib/priorityEngine.ts`.
Here's how I calculate it:
- **Weights**: Placements get the highest priority (3), Results are next (2), and Events are the lowest (1).
- **Recency**: I map the notification timestamps into a normalized decimal score between 0 and 1.
- **Formula**: `Score = (Type Weight * 100) + Normalized Recency`

This guarantees that Placements are always grouped at the top of the inbox, but within the Placements group itself, the newest ones show up first. Also, I made sure the inbox takes a snapshot on load so reading a message doesn't make the list randomly jump around.

## Tech Stack
- **Frontend**: Next.js 14, React.
- **Styling**: Material UI (MUI).
- **API Proxy**: I set up Next.js server-side route handlers (`/api/notifications` and `/api/logs`) to proxy my requests. This allowed me to attach the Bearer token securely and completely bypassed any CORS issues from the browser.
