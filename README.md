# Campus Notification System

This is my frontend submission for the campus hiring assessment. It's built using Next.js, React, and TypeScript.

The goal of this project is to efficiently fetch, rank, and display notifications from the campus API while properly logging interactions back to the evaluation server.

## Features

- **Priority Inbox:** Automatically sorts incoming notifications based on their importance (Placement, Result, Event) and recency.
- **Real-time Feed:** A main feed where you can easily filter notifications by category.
- **API Proxying:** Connects to the remote evaluation server and securely passes the `Authorization` token to handle cross-origin requests seamlessly.
- **Telemetry Logging:** Sends system logs and interactions in real-time to the evaluation service without blocking the main application thread.

## Running Locally

Make sure you have your `.env.local` file set up with the required authentication token before starting.

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- Material-UI (MUI)
