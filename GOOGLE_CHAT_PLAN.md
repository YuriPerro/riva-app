# Google Chat Integration Plan

Feature plan for integrating Google Chat into Riva — read and send messages from the desktop app.

---

## Scope

| In scope | Out of scope |
|----------|-------------|
| List spaces the user belongs to | Admin/org management APIs |
| Read messages in a space | File uploads / attachments |
| Send text messages to a space | Google Meet integration |
| OAuth 2.0 + PKCE authentication | Service account / bot mode |
| Token refresh and revocation | Message reactions / threads (v1) |

---

## Security Architecture

### Authentication: OAuth 2.0 with PKCE

PKCE (Proof Key for Code Exchange) is the recommended flow for desktop apps. It eliminates the need to embed a `client_secret` in the binary.

```
User clicks "Connect Google Chat"
  │
  ▼
Rust generates:
  ├── code_verifier  (cryptographic random, 128 chars)
  ├── code_challenge = SHA256(code_verifier)
  └── state          (CSRF protection token)
  │
  ▼
System browser opens → Google consent screen
  │
  ▼
User approves → Google redirects to localhost:{PORT}/callback
  │
  ▼
Rust ephemeral HTTP server catches auth code
  ├── Validates state parameter (CSRF check)
  ├── Shuts down server immediately
  │
  ▼
Rust exchanges code + code_verifier → Google token endpoint
  │
  ▼
Receives access_token (1h) + refresh_token
  │
  ▼
Tokens stored at ~/.riva/google.json (0o600 permissions)
Tokens loaded into AppState (Rust memory only)
```

### Why PKCE

| Threat | Mitigation |
|--------|-----------|
| Binary reverse-engineering | No client_secret embedded — PKCE eliminates the need |
| Auth code interception | Code is useless without code_verifier (never leaves Rust) |
| CSRF / session fixation | state parameter validated on callback |
| Token leakage to frontend | Tokens exist only in Rust memory, never cross IPC boundary |
| Stolen refresh token | Supports token rotation — each refresh invalidates the previous |

### Minimum OAuth Scopes

```
chat.spaces.readonly    → List spaces the user belongs to
chat.messages.readonly  → Read messages in a space
chat.messages.create    → Send messages to a space
```

No admin scopes. No user management. No space creation/deletion.

### Token Lifecycle

```
GoogleAuthState (lives in Rust AppState)
├── access_token   (short-lived, ~1 hour)
├── refresh_token  (long-lived, rotated on use)
├── expires_at     (unix timestamp)
└── scopes         (granted scopes for validation)

On every API call:
  if now() > expires_at - 60s:
    POST to token endpoint with refresh_token
    Update access_token + expires_at
    Persist updated tokens to disk
    If refresh fails → clear tokens, prompt re-auth
```

### Data Flow

```
┌──────────────┐     invoke()      ┌──────────────────┐      HTTPS        ┌──────────────┐
│   React UI   │ ───────────────→  │   Rust Backend    │ ──────────────→  │  Google Chat  │
│  (webview)   │                   │   (Tauri IPC)     │                  │     API       │
│              │ ←─────────────── │                   │ ←────────────── │              │
│  Never sees  │   typed response  │  Holds tokens     │   Bearer token   │              │
│  any tokens  │                   │  in AppState      │   in header      │              │
└──────────────┘                   └──────────────────┘                   └──────────────┘
```

---

## Security Checklist

For review by the security team:

- [ ] OAuth 2.0 + PKCE — no secrets embedded in the application binary
- [ ] Minimum scopes — read spaces, read messages, send messages only
- [ ] Tokens never reach the webview/frontend layer
- [ ] All HTTP calls via Rust reqwest with HTTPS-only enforcement
- [ ] Credential file stored with 0o600 permissions (owner read/write only)
- [ ] Refresh token rotation enabled
- [ ] Ephemeral localhost callback server (lives < 1 second after catching the code)
- [ ] CSRF protection via state parameter
- [ ] Token revocation on disconnect (calls Google revoke endpoint)
- [ ] No Google Workspace admin APIs accessed
- [ ] Access token auto-expires after ~1 hour (Google-enforced)
- [ ] Future: migrate to OS keyring (macOS Keychain / Windows Credential Manager)

### Optional Hardening

If required by security policy:

| Measure | Description |
|---------|-------------|
| Encryption at rest | AES-256 encrypt `google.json` with a key derived from machine ID |
| Session timeout | Auto-disconnect after N hours of inactivity |
| Audit logging | Log all API calls locally with timestamps for compliance |
| Scope verification | Validate granted scopes on every token refresh |

---

## Google Cloud Console Setup

Prerequisites before development:

1. Create a Google Cloud project (or use existing org project)
2. Enable the **Google Chat API**
3. Create an **OAuth 2.0 Client ID** (application type: Desktop)
4. Configure the **OAuth consent screen** (internal = org-only, recommended)
5. Request Workspace admin approval if org policy restricts third-party OAuth apps

---

## Rust Backend

### New Module: `src-tauri/src/google_chat.rs`

#### Structs

```rust
struct GoogleTokens {
    access_token: String,
    refresh_token: String,
    expires_at: i64,
    scopes: Vec<String>,
}

struct GoogleAuthState {
    tokens: Option<GoogleTokens>,
    client_id: String,
}

struct Space {
    name: String,
    display_name: String,
    space_type: String,        // DIRECT_MESSAGE | SPACE | GROUP_CHAT
    single_user_bot_dm: bool,
}

struct Message {
    name: String,
    sender_name: String,
    sender_avatar_url: Option<String>,
    text: String,
    create_time: String,
    thread_name: Option<String>,
}
```

#### Tauri Commands

```rust
// Auth lifecycle
#[tauri::command]
fn google_auth_start(state: State<AppState>) -> Result<(), String>
// Generates PKCE params, opens browser, starts ephemeral callback server,
// exchanges code for tokens, persists to disk

#[tauri::command]
fn google_auth_status(state: State<AppState>) -> bool
// Returns whether valid Google tokens exist in memory

#[tauri::command]
fn google_auth_disconnect(state: State<AppState>) -> Result<(), String>
// Revokes tokens via Google API, clears from memory and disk

// Chat operations
#[tauri::command]
async fn google_chat_list_spaces(state: State<'_, AppState>) -> Result<Vec<Space>, String>
// GET https://chat.googleapis.com/v1/spaces (with auto-refresh)

#[tauri::command]
async fn google_chat_get_messages(
    state: State<'_, AppState>,
    space_name: String,
    page_size: Option<i32>,
) -> Result<Vec<Message>, String>
// GET https://chat.googleapis.com/v1/{space_name}/messages

#[tauri::command]
async fn google_chat_send_message(
    state: State<'_, AppState>,
    space_name: String,
    text: String,
) -> Result<Message, String>
// POST https://chat.googleapis.com/v1/{space_name}/messages
```

#### Token Storage

```
~/.riva/google.json    (0o600 permissions)
{
  "access_token": "ya29...",
  "refresh_token": "1//...",
  "expires_at": 1720000000,
  "scopes": ["chat.spaces.readonly", "chat.messages.readonly", "chat.messages.create"]
}
```

Same pattern as existing `~/.riva/credentials.json` and `~/.riva/openai.json`.

### Changes to `src-tauri/src/lib.rs`

```rust
mod google_chat;

// Add to AppState:
pub struct AppState {
    credentials: Mutex<Option<Credentials>>,
    google_auth: Mutex<Option<google_chat::GoogleTokens>>,  // NEW
}

// Add to generate_handler![]:
google_auth_start,
google_auth_status,
google_auth_disconnect,
google_chat_list_spaces,
google_chat_get_messages,
google_chat_send_message,
```

### New Rust Dependencies

```toml
# src-tauri/Cargo.toml
[dependencies]
sha2 = "0.10"           # SHA256 for PKCE code_challenge
base64 = "0.22"         # Already used — base64url for PKCE
rand = "0.8"            # code_verifier + state generation
tiny_http = "0.12"      # Ephemeral localhost callback server
```

---

## Frontend

### New Types: `src/types/google-chat.ts`

```typescript
export type SpaceType = 'direct-message' | 'space' | 'group-chat';

export type GoogleSpace = {
  name: string;
  displayName: string;
  type: SpaceType;
};

export type GoogleMessage = {
  id: string;
  senderName: string;
  senderAvatarUrl: string | null;
  text: string;
  createdAt: string;
  threadName: string | null;
};
```

### New Commands: `src/types/commands.ts`

```typescript
export enum TauriCommand {
  // ... existing commands

  // Google Chat
  GoogleAuthStart = 'google_auth_start',
  GoogleAuthStatus = 'google_auth_status',
  GoogleAuthDisconnect = 'google_auth_disconnect',
  GoogleChatListSpaces = 'google_chat_list_spaces',
  GoogleChatGetMessages = 'google_chat_get_messages',
  GoogleChatSendMessage = 'google_chat_send_message',
}
```

### Tauri Wrapper: `src/lib/tauri/google-chat.ts`

```typescript
export const googleChat = {
  authStart: () => invoke<void>(TauriCommand.GoogleAuthStart),
  authStatus: () => invoke<boolean>(TauriCommand.GoogleAuthStatus),
  disconnect: () => invoke<void>(TauriCommand.GoogleAuthDisconnect),
  listSpaces: () => invoke<GoogleSpace[]>(TauriCommand.GoogleChatListSpaces),
  getMessages: (spaceName: string, pageSize?: number) =>
    invoke<GoogleMessage[]>(TauriCommand.GoogleChatGetMessages, { spaceName, pageSize }),
  sendMessage: (spaceName: string, text: string) =>
    invoke<GoogleMessage>(TauriCommand.GoogleChatSendMessage, { spaceName, text }),
};
```

### Page Structure

```
src/pages/chat/
├── index.tsx
├── types.ts
├── use-chat.ts
└── components/
    ├── chat-space-list/
    │   ├── index.tsx
    │   └── types.ts
    ├── chat-messages/
    │   ├── index.tsx
    │   └── types.ts
    ├── chat-message-input/
    │   ├── index.tsx
    │   └── types.ts
    └── chat-connect/
        ├── index.tsx
        └── types.ts
```

### Settings Integration

Add a "Google Chat" section to the existing settings page:

- Connection status indicator (connected / disconnected)
- "Connect Google Chat" button → triggers `google_auth_start`
- "Disconnect" button → triggers `google_auth_disconnect`
- Connected account info (email/name from Google userinfo)

### Routing

Add to existing route config:

```typescript
{ path: Route.Chat, element: <ChatPage /> }
```

Add navigation item to sidebar with a chat icon.

---

## Implementation Phases

### Phase 1: Auth Foundation

- [ ] Create `google_chat.rs` module with PKCE OAuth flow
- [ ] Implement token storage/load/clear (same pattern as credentials.json)
- [ ] Add `google_auth_start`, `google_auth_status`, `google_auth_disconnect` commands
- [ ] Register commands in `lib.rs`
- [ ] Add frontend wrappers in `src/lib/tauri/google-chat.ts`
- [ ] Add Google Chat section to settings page (connect/disconnect)

### Phase 2: Read Spaces & Messages

- [ ] Implement `google_chat_list_spaces` with auto-token-refresh
- [ ] Implement `google_chat_get_messages` with pagination
- [ ] Create chat page with space list and message view
- [ ] Add TanStack Query hooks for spaces and messages
- [ ] Add route and sidebar navigation

### Phase 3: Send Messages

- [ ] Implement `google_chat_send_message` command
- [ ] Create message input component
- [ ] Optimistic updates via TanStack Query mutation
- [ ] Auto-refresh message list on send

### Phase 4: Polish

- [ ] i18n for all chat UI strings (pt-BR + en)
- [ ] Empty states and error handling
- [ ] Loading skeletons
- [ ] Unread indicators (if API supports)
- [ ] Auto-refresh interval for active space

---

## API Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List spaces | GET | `https://chat.googleapis.com/v1/spaces` |
| Get messages | GET | `https://chat.googleapis.com/v1/{space}/messages` |
| Send message | POST | `https://chat.googleapis.com/v1/{space}/messages` |
| Revoke token | POST | `https://oauth2.googleapis.com/revoke?token={token}` |
| Refresh token | POST | `https://oauth2.googleapis.com/token` |
| Auth consent | GET | `https://accounts.google.com/o/oauth2/v2/auth` |

All requests include `Authorization: Bearer {access_token}` header, constructed in Rust only.
