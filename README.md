# Local — Your Mutual Polyglot Friend

**HackEurope · Agentic AI track** — Voice-first conversation coach for travelers in foreign languages.

- **Primary input:** Voice (earphones)  
- **Primary output:** Sound (earphones)  
- **Secondary:** Text in/out on screen  
- **APIs:** Google Gemini

## Quick start

### 1. Backend (Python)

```bash
cd /path/to/BugNoir
python -m venv .venv   # if not already
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
```

Create a `.env` file in the **project root** (same folder as this README):

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the API (from project root):

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --workers 1
```

`--workers 1` is required for the in-memory session store. For production, replace the sessions dict with Redis.

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The app proxies `/api` to the backend.

## Flow

1. **Where are you going?** — Paris, London, or Morocco (voice or tap).
2. **Intro** — “Wow, what a location…” → **Okay**.
3. **7 onboarding questions** — Personality, occasion, pronunciation, slang, profession, hobbies (buttons + voice/text where noted).
4. **Thanks** — “What an interesting individual!…” → **I’m here** when you’ve arrived.
5. **Welcome to [location]** → **Start Convo**.
6. **STEP Z (conversation)**  
   - Enter what the other person said (voice or text).  
   - App shows: **translation in English**, then **suggested reply** (phonetic in RBT, local language in black, English in red).  
   - User repeats the phrase or asks for a new suggestion; say “Au revoir” or tap **End Convo** to finish.
7. **End** — **Start Convo** (again) or **New User** (full reset).

## Tech stack

- **Backend:** FastAPI, Pydantic, Google Gemini (translation, suggestions, phonetic).
- **Frontend:** React 18, Vite, TypeScript, Web Speech API (voice in/out), CSS (Liquid Glass / RBT theme).
- **Agents:** Personal Agent (user context), Local Agent (translation + phonetic), Communicator (orchestration).

## UI

- White background, **Royal Blue (RBT)** for primary text and phonetic spelling.
- **Black** for local language spelling, **red** for English translation.
- Font: Times New Roman (with fallbacks).
- Liquid Glass–style panels and chamfered “Okay” button.

## Testing the new features

### 1. Config and value (billing) APIs

With the backend running:

- **Health (uses config):**  
  `curl http://localhost:8000/api/health`  
  → `{"status":"ok","gemini_configured":true}` when `GEMINI_API_KEY` (or `LIVE_TRANSLATION_API_KEY`) is set.

- **Value summary (Paid.ai):**  
  `curl http://localhost:8000/api/value/summary`  
  → `{"total_events":0,"total_cost_eur":0,"average_complexity":0}` at first; after some Step Z turns or REST conversations, counts and cost go up.

- **Recent value events:**  
  `curl "http://localhost:8000/api/value/events?limit=5"`  
  → `{"events":[...]}` with `complexity_score`, `estimated_cost_eur`, `timestamp`, etc.

- **Dashboard (existing):**  
  `curl http://localhost:8000/api/dashboard`  
  → Same data plus full log; the app’s “Dashboard” button on the **ended** step uses this.

To see value events increase: complete onboarding, go to **Conversation**, then use “Capture what the other person said” (voice or text) at least once. After that, open **Dashboard** on the ended screen or call `/api/value/summary` and `/api/value/events`.

### 2. WebSocket (Gemini Live) and `usePolyglotConnection`

- **Backend:** The WebSocket is at `ws://localhost:8000/ws/translate`. The server expects the **first message** to be JSON with user context (e.g. `{"target_region":"Paris","target_language":"French","slang_level":"Moderate","occasion":"Holiday"}`). After that it expects binary PCM (16 kHz, mono, Int16). It sends back JSON (phonetic_spelling, local_spelling, english_translation) and binary audio.

- **Frontend:** The hook `usePolyglotConnection` is in `frontend/src/hooks/usePolyglotConnection.ts`. To try it:
  1. In any component: `const { status, translation, connect, startMicrophone, disconnect } = usePolyglotConnection({ onTranslation: (u) => console.log(u) });`
  2. Call `connect({ target_region: 'Paris', target_language: 'French', slang_level: 'Moderate', occasion: 'Holiday' })` when the WebSocket should connect.
  3. Call `startMicrophone()` to stream mic PCM to the server.
  4. Check `translation` (or `onTranslation`) for the three lines; binary replies are played automatically.

- **Note:** The Live API path uses a Gemini Live–capable model (e.g. `gemini-2.0-flash-live-001`). If your key doesn’t support it, the WebSocket may send back an error in the first JSON. The REST flow (onboarding → conversation with voice/text) does not require the Live API and still records value via the existing Dashboard.

### 3. Quick checklist

| Feature | How to see it works |
|--------|-----------------------|
| Config (pydantic-settings) | Backend starts and `/api/health` reflects `GEMINI_API_KEY` / `LIVE_TRANSLATION_API_KEY`. |
| ValueTracker / record_step_z | Do at least one conversation turn (REST or Live), then call `/api/value/summary` or open Dashboard on ended step. |
| `/api/value/summary` | `curl http://localhost:8000/api/value/summary` shows `total_events`, `total_cost_eur`, `average_complexity`. |
| `/api/value/events` | `curl "http://localhost:8000/api/value/events?limit=5"` shows recent billable events. |
| WebSocket `/ws/translate` | Connect with a client (or the frontend hook), send context JSON then PCM; receive JSON + audio. |
| `usePolyglotConnection` | Use the hook in a page, call `connect(context)` then `startMicrophone()`; watch `translation` and listen for played audio. |

## License

MIT.
