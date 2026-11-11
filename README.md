
# Mal AI — React Native Banking Assistant

A React Native banking assistant featuring account
overview, AI-powered chat, streaming responses,
spending summaries, and transfer drafts.

## Features

- Home dashboard with account balances
- Recent transactions
- Dynamic chat suggestions
- Real-time assistant responses using SSE
- Message history and pagination
- Streaming reconnection and sequence deduplication
- Background and process restart recovery
- Spending summary widget
- Transfer draft with idempotent actions
- Error and retry handling

## Tech Stack

- React Native
- TypeScript
- React Navigation
- React Hooks
- Fetch API
- Server-Sent Events
- AsyncStorage

## Setup

1. Clone the repository.
2. Install dependencies:

   npm install

3. Configure your assignment session token
   in src/api/config.ts.

4. Install iOS dependencies:

   npx pod-install

5. Start Metro:

   npm start

6. Run the app:

   npm run ios

   # or

   npm run android

## Validation

Run TypeScript validation:

npx tsc --noEmit

## Architecture

Describe API client, Home hooks, ChatContext,
SSE handling, persistence, and widget handling.

## Demo

Add your demo video link here.

## Notes


