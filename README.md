# Mal AI — React Native Banking Assistant

A React Native banking assistant featuring account overviews, AI-powered conversations, real-time streaming responses, spending summaries, and transfer drafts.

## Demo

Watch the complete application walkthrough:

[▶ Watch Mal AI Demo](https://drive.google.com/file/d/13uL6UL_u6K1J8v_VsnCwMtfVMr2nLQ2u/view?usp=sharing)

## Features

- Home dashboard with account balances
- Recent transactions
- Dynamic chat suggestions
- Real-time assistant responses using Server-Sent Events (SSE)
- Message history and pagination
- Stream reconnection and sequence-based deduplication
- Conversation recovery after backgrounding and process restarts
- Spending summary widget
- Transfer draft with idempotency-protected actions
- Error handling and retry mechanisms

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

   ```bash
   npm install
   ```

3. Configure your assignment session token in `src/api/config.ts`.

4. Install iOS dependencies:

   ```bash
   npx pod-install
   ```

5. Start Metro:

   ```bash
   npm start
   ```

6. Run the application:

   ```bash
   npm run ios
   ```

   Or:

   ```bash
   npm run android
   ```

## Validation

Run TypeScript validation:

```bash
npx tsc --noEmit
```

## Architecture

The application follows a modular architecture:

- **API Layer:** Centralized API client for authentication, requests, response parsing, and error handling.
- **Home Hooks:** Independent data-fetching hooks for profile, accounts, transactions, and suggestions.
- **ChatContext:** Centralized chat state, optimistic updates, message history, and persistence.
- **Streaming:** SSE handling with sequence tracking, duplicate event detection, and reconnection.
- **Persistence:** AsyncStorage for restoring conversations and recovering interrupted responses.
- **Widgets:** Modular rendering and action handling for spending summaries and transfer drafts.

## Notes

- Requires a valid assignment session token.
- Configure the token locally in `src/api/config.ts`.
- Do not commit actual session credentials.
- The application communicates with the provided assignment backend.