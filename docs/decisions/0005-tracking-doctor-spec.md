# Tracking Doctor - Feature Specification

## Overview
The "Tracking Doctor" is a diagnostic tool integrated into TrackFlow designed to assist marketing professionals and developers in debugging server-side tracking implementations, particularly for Facebook Conversions API (CAPI).

## Core Problems Addressed
1. **Payload Opacity**: Users often send webhooks with malformed JSON or missing required fields for advertising networks, leading to silent drops in event tracking.
2. **Connection Issues**: Invalid Access Tokens or Pixel IDs cause API requests to fail. 
3. **End-to-End Tracing**: Users struggle to know if an event triggered on their website successfully reached the final destination.

## Architecture & Modules

### 1. Payload Analyzer
- **Interface**: A JSON editor in the frontend (`Doctor.tsx`) allowing users to paste webhook payloads.
- **Backend API**: `POST /api/doctor/analyze`
- **Logic**: Uses Zod schemas to validate standard CAPI event structures. It checks for:
  - Presence of `event_name` and `event_time`.
  - Required User Data parameters (at least one of `em`, `ph`, `client_ip_address`, `fbp`, `fbc`).
  - Hashing rules (e.g. `em` and `ph` must be SHA256 hashed).
- **Output**: Returns an array of specific error paths and human-readable messages to guide the user in fixing their payload.

### 2. Connection Health Check
- **Interface**: Input fields for Pixel ID and System User Access Token.
- **Backend API**: `POST /api/doctor/test-connection`
- **Logic**: Makes a lightweight `GET` request to the Facebook Graph API (`https://graph.facebook.com/v19.0/{pixelId}?access_token={token}`).
- **Output**: Verifies if the token is valid and has the necessary permissions to access the specified Pixel. Returns a success message or the exact error from Facebook.

### 3. Event Simulator (Future Implementation)
- Will allow users to dispatch mock events (PageView, Lead, Purchase) directly to their TrackFlow Webhook URL.
- Will trace the event through the internal queue system and provide a detailed log of processing steps and the final response from Facebook CAPI.

## Future Enhancements
- **AI Integration**: Automatically generate tracking code snippets (JavaScript or PHP) based on the exact errors found in the payload analyzer.
- **Support for Google Analytics 4 (GA4)**: Expand the schema validation to include GA4 Measurement Protocol standards.
- **Chrome Extension**: A companion extension that captures client-side events and automatically pipes them into the Tracking Doctor for real-time debugging.
