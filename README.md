# LOCAL — AI Personal Local Guide

**HackEurope 48-Hour Hackathon | Team bugnoir**

Multi-agent AI that combines user personality memory with real-time local cultural knowledge (Paris) to produce contextualised travel responses — not word-for-word translation.

## Stack

- **Backend:** Python 3.11 + FastAPI  
- **LLM:** Google Gemini (gemini-1.5-pro)  
- **Vector DB:** Pinecone (user personality) — in-memory fallback if blocked  
- **SQL DB:** PostgreSQL (conversation history) — optional  
- **STT:** OpenAI Whisper API  
- **TTS:** ElevenLabs API  
- **Frontend:** React 18 + TypeScript + Tailwind CSS  

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Optional: copy .env.example to .env at repo root and add real keys
# From repo root (so backend package resolves):
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite proxy forwards `/interact` and `/health` to the backend.

### 3. Demo flow

1. Enter a demo user ID (e.g. `demo-user-001`).  
2. Allow mic; record a question (e.g. “How do I ask to split the bill?”).  
3. Get three variants (formal, casual, joking) and optional TTS.

## Main endpoint

- **POST /interact**  
  Body: `{ user_id, audio_base64, latitude, longitude, location_type }`  
  Response: `{ variants: { formal, casual, joking }, recommended, audio_url?, langsmith_trace_url? }`

## MVP constraints

- Paris only (one JSON knowledge base).  
- No real auth (`user_id` = hardcoded UUID for demo).  
- No Docker, no live voice streaming.  
- If Pinecone/Postgres/Whisper/ElevenLabs are blocked, the app falls back to mocks so it still runs.

## File structure

```
backend/
  main.py
  agents/          # personality_parser, context_resolver, response_generator, memory_updater
  services/        # gemini_client, pinecone_client, whisper_client, elevenlabs_client
  data/paris_knowledge_base.json
  models/schemas.py
  db/postgres.py
  requirements.txt
frontend/
  src/components/  # OnboardingForm, VoiceInput, ResponseCard, MemoryBadge
  src/api/localApi.ts
```

## Environment

Copy `.env.example` to `backend/.env` (or project root) and replace fake keys when Gemini/Pinecone/Whisper/ElevenLabs/LangSmith/Postgres are available.
