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

## License

MIT.
