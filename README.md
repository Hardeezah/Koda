# KodaTrade — Nigerian Trade Compliance Platform

> **AI-powered trade compliance for Nigerian importers & exporters.** Scan a product, get instant regulatory verdicts with citations, generate documents, and stay compliant with NCS, NAFDAC, SON, CBN, AfCFTA rules.

---

## 🎯 What It Does

| Feature | Description |
|---------|-------------|
| **Import Compliance Check** | Scan product → get HS code, NCS/NAFDAC/SON/CBN requirements, prohibition status, required permits |
| **Export / AfCFTA Check** | Verify Rules of Origin, tariff savings, ROO eligibility for 54 African markets |
| **Document Generation** | Auto-generate Form M, PAAR, NAFDAC applications, SON certificates, NEPC certificates |
| **Trade Ledger** | Persistent history of all checks, audit trail, compliance scoring |
| **Broker Communication** | AI-drafted emails to customs brokers with pre-filled Form M / PAAR details |
| **Digital Trade Passport** | Profile completeness + compliance score + CAC verification → shareable passport |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                          │
├──────────────────────┬──────────────────────┬───────────────────┤
│  Mobile (React Native│   Web Dashboard      │   Admin / API     │
│  + Expo)             │   (Next.js 14)       │   (FastAPI)       │
└──────────┬───────────┴──────────┬───────────┴────────┬──────────┘
           │                      │                    │
           └──────────────────────┼────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Auth    │ │ Compliance│ │ AfCFTA   │ │ Docs     │ │ Comm   │ │
│  │ (Supabase│ │ (RAG)    │ │ (Tariff) │ │ (Gen)    │ │ (Email)│ │
└──────────┬───────────┴──────────┴──────────┴──────────┴────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│  │ Supabase         │ │ Upstash Redis    │ │ pgvector       │  │
│  │ (PostgreSQL +    │ │ (AfCFTA cache)   │ │ (1536-dim →     │  │
│  │  pgvector)       │ │                  │ │  384-dim local)│  │
│  └──────────────────┘ └──────────────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 RAG Pipeline (Core Intelligence)

```
User Query ("frozen chicken import")
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  LOCAL EMBEDDINGS (fastembed: BAAI/bge-small-en-v1.5, 384d)  │
│  Query → vector → pgvector cosine search (IVFFlat, lists=10) │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  RETRIEVER                                                   │
│  match_document_chunks(query_embedding, match_count=8,       │
│                        min_similarity=0.30, filter_agency)   │
│  → top 8 regulatory chunks from NCS, NAFDAC, SON, CBN, etc.  │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  RERANKER (keyword boost)                                    │
│  +0.05 similarity per query-term match in chunk content      │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  CONTEXT FORMATTER                                           │
│  - Max 6000 chars total                                      │
│  - Citations extracted (source, agency, excerpt, score)      │
│  - Truncation warning if context exceeds limit               │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  GROQ LLM (Llama 3.3 70B Versatile, temp=0.2, JSON mode)     │
│  System prompt: Nigerian trade compliance expert              │
│  User prompt: product + context + strict JSON schema          │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  CitedComplianceVerdict (Pydantic)                           │
│  status, HS code, summary, risks, citations, AfCFTA data     │
└──────────────────────────────────────────────────────────────┘
```

**Fallback**: If RAG fails → LLM-only mode with `"retrieval_used": false`, lower confidence (0.40 vs 0.75).

---

## 📦 Project Structure

```
koda-trade/
├── .github/
│   └── workflows/ci.yml          # CI: backend tests, frontend type-check, web build
├── backend/                      # FastAPI Backend (Python 3.11)
│   ├── app/
│   │   ├── api/v1/endpoints/     # REST endpoints
│   │   │   ├── auth.py           # Register + Login (Supabase)
│   │   │   ├── compliance.py     # POST /check, /analyze_image, /generate_document
│   │   │   ├── afcfta.py         # POST /afcfta/check (tariff + ROO + cache)
│   │   │   ├── documents.py      # Document CRUD
│   │   │   ├── communication.py  # POST /draft (broker email)
│   │   │   ├── orchestration.py  # Scan → HS → Compliance → Ledger
│   │   │   ├── profile.py        # User profile + CAC
│   │   │   └── ledger.py         # Trade history
│   │   ├── core/
│   │   │   └── config.py         # Pydantic Settings (env)
│   │   ├── domain/models/        # Pydantic models
│   │   │   ├── compliance.py     # TextComplianceRequest, CitedComplianceVerdict
│   │   │   ├── rag.py            # RetrievedChunk, Citation
│   │   │   ├── vision.py         # ProductAttributes, HSCodeResult
│   │   │   └── afcfta.py         # AfCFTACheckRequest/Response
│   │   ├── infrastructure/
│   │   │   ├── rag/              # RAG Pipeline
│   │   │   │   ├── retriever.py          # pgvector search + retries
│   │   │   │   ├── reranker.py           # keyword boost + citations
│   │   │   │   ├── compliance_chain.py   # Groq LLM + prompt + parse
│   │   │   │   └── document_ingestion.py # chunk → embed → upsert
│   │   │   ├── ai/               # AI Services
│   │   │   │   ├── intelligence.py       # analyze_compliance (RAG + fallback)
│   │   │   │   ├── compliance_utils.py   # confidence scoring
│   │   │   │   ├── hs_classifier.py      # image → attributes → HS code
│   │   │   │   ├── vision_pipeline.py    # image → attributes (Llama 4 Scout)
│   │   │   │   └── communication.py      # broker email drafts
│   │   │   ├── db/               # Supabase repositories
│   │   │   │   ├── supabase.py   # client singleton
│   │   │   │   ├── afcfta_queries.py     # tariff + ROO SQL
│   │   │   │   └── hs_code_repository.py # HS code vector search
│   │   │   └── redis_client.py   # Upstash REST client
│   │   ├── middleware/           # rate_limit, security_headers, request_logging
│   │   └── main.py               # FastAPI app + CORS + middleware
│   ├── assets/regulations/       # Source .txt files for ingestion
│   │   ├── ncs_2026_prohibition_list.txt
│   │   ├── afcfta_rules_of_origin.txt
│   │   ├── afcfta_nigeria_tariff_offer.txt
│   │   ├── cbn_trade_finance_circular.txt
│   │   ├── nafdac_import_guidelines.txt
│   │   └── son_mancap_schedule.txt
│   ├── migrations/               # Supabase SQL (run in SQL Editor)
│   ├── tests/                    # 55 pytest tests (RAG, endpoints, auth)
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/                     # React Native + Expo (Mobile)
│   ├── src/
│   │   ├── presentation/
│   │   │   ├── screens/          # All UI screens
│   │   │   │   ├── compliance/   # HSResult, ComplianceResult, ComplianceSearch
│   │   │   │   ├── afcfta/       # AfCFTAReport
│   │   │   │   ├── passport/     # ExportScore
│   │   │   │   ├── scanner/      # CameraScan
│   │   │   │   ├── dashboard/    # Dashboard, ExportScore
│   │   │   │   ├── ledger/       # Ledger
│   │   │   │   ├── profile/      # Profile, EditProfile
│   │   │   │   ├── auth/         # Login, Signup
│   │   │   │   └── shared/       # Communication
│   │   │   ├── components/       # Reusable UI (Button, ScreenLayout, Typography)
│   │   │   └── hooks/            # Custom hooks
│   │   ├── context/              # TradeModeContext (import/export toggle)
│   │   ├── infrastructure/       # Supabase client, API client
│   │   └── utils/                # score.ts (centralized compliance score)
│   ├── app.json                  # Expo config
│   ├── tsconfig.json
│   └── package.json
├── web/                          # Next.js 14 (Web Dashboard)
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── dashboard/        # Compliance, AfCFTA, Documents, Ledger, Profile
│   │   │   ├── login/, signup/   # Auth pages
│   │   ├── context/              # AuthContext, TradeModeContext
│   │   └── lib/                  # API client, Supabase client
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml            # Local stack: db, redis, backend, frontend, web
├── run.sh                        # Unified dev runner (see below)
├── .gitignore
└── README.md
```

---

## 🔧 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Backend API** | FastAPI | 0.110+ | Async REST, OpenAPI docs |
| **Auth** | Supabase Auth | - | JWT, email/password, OAuth ready |
| **Database** | Supabase (PostgreSQL 15 + pgvector) | - | Relational + vector search |
| **Vector Search** | pgvector (IVFFlat, cosine) | - | Semantic retrieval |
| **Embeddings** | fastembed (BAAI/bge-small-en-v1.5) | 0.8+ | **Local**, 384-dim, no API key |
| **LLM** | Groq (Llama 3.3 70B Versatile) | - | Fast inference, JSON mode |
| **Vision** | Groq (Llama 4 Scout 17B) | - | Image → product attributes |
| **Cache** | Upstash Redis (REST) | - | AfCFTA tariff/ROO cache (24h TTL) |
| **PDF** | PyMuPDF (fitz) | - | Regulation PDF text extraction |
| **Mobile** | React Native + Expo | 50 / 49 | iOS/Android/Web |
| **Web** | Next.js 14 (App Router) | 14.2+ | Dashboard, SSR |
| **Styling** | NativeWind (Tailwind for RN) | 4+ | Utility-first styling |
| **CI/CD** | GitHub Actions | - | Tests, type-check, build |
| **Container** | Docker / docker-compose | - | Local + prod parity |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (for full stack)
- **OR** Python 3.11+, Node 20+, pnpm/npm
- Supabase project (free tier works)
- Groq API key (free tier works)
- Upstash Redis (free tier works)

### 1. Clone & Configure

```bash
git clone <repo-url>
cd koda-trade

# Copy env templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # if exists
cp web/.env.example web/.env             # if exists
```

**Edit `backend/.env` with your keys:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
OPENAI_API_KEY=sk-xxx  # optional, not used if fastembed works
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://localhost:8081
```

### 2. Run Database Migrations

Open **Supabase Dashboard → SQL Editor → New Query** and run each file in `backend/migrations/` in order:
1. `20250725_fix_vector_indexes.sql` (creates `document_chunks`, `hs_codes`, RPC functions)
2. `20260725_create_all_rag_tables.sql` (creates AfCFTA tables + RLS)

### 3. Start Everything (Docker)

```bash
# From root
docker compose up --build
```

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000/docs |
| Frontend (Expo) | http://localhost:8081 |
| Web Dashboard | http://localhost:3000 |
| Supabase (local) | http://localhost:5432 |

### 4. Ingest Regulatory Documents

```bash
# One-time setup: embeds all 6 regulation files into pgvector
docker compose exec backend python -c "
from app.infrastructure.rag.document_ingestion import ingest_all_from_assets
import asyncio
print(asyncio.run(ingest_all_from_assets()))
"
# Expected: {'afcfta_rules_of_origin': 22, 'afcfta_nigeria_tariff_offer': 15, ...}
```

### 5. Run Without Docker (Alternative)

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend (Mobile)
cd frontend
npm install --legacy-peer-deps
npx expo start --lan

# Terminal 3: Web Dashboard
cd web
npm install --legacy-peer-deps
npm run dev
```

---

## 🏃 Unified Runner (`run.sh`)

```bash
# From project root
chmod +x run.sh

./run.sh backend      # Start FastAPI (uvicorn)
./run.sh frontend     # Start Expo (npx expo start --lan)
./run.sh web          # Start Next.js (npm run dev)
./run.sh mobile       # Expo LAN mode for phone testing
./run.sh dev          # Backend + Frontend together
./run.sh all          # Full docker compose stack
./run.sh test         # Run all tests (backend + frontend TS + web build)
./run.sh ingest       # Ingest regulation docs into Supabase
./run.sh db           # Print all migration SQL (copy-paste to Supabase)
./run.sh help         # Show usage
```

---

## 🧪 Testing

```bash
# Backend (55 tests)
cd backend
source venv/bin/activate
python -m pytest tests/ -v --tb=short

# Frontend type-check
cd frontend
npx tsc --noEmit

# Web build check
cd web
npm run build
```

**All must pass before PR.**

---

## 📦 Regulatory Data Sources (Ingested)

| File | Source | Updated | Chunks |
|------|--------|---------|--------|
| `ncs_2026_prohibition_list.txt` | Nigeria Customs Service (customs.gov.ng) | Apr 2026 | 18 |
| `afcfta_rules_of_origin.txt` | AfCFTA Annex 2 + Appendix IV | Jan 2024 | 22 |
| `afcfta_nigeria_tariff_offer.txt` | FMITI PSTCs + ECOWAS CET | Apr 2025 | 15 |
| `cbn_trade_finance_circular.txt` | CBN FX Manual 4th Ed + Circulars | Jun 2026 | 17 |
| `nafdac_import_guidelines.txt` | NAFDAC Registration Guidelines | Jan 2025 | 24 |
| `son_mancap_schedule.txt` | SON Act 14/2015 + SONCAP/MANCAP | 2025 | 17 |

**Total: 113 chunks, ~90KB text** — all embedded locally via fastembed.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | ✅ | Anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role (admin) |
| `GROQ_API_KEY` | ✅ | `gsk_...` from console.groq.com |
| `UPSTASH_REDIS_REST_URL` | ✅ | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash REST token |
| `CORS_ORIGINS` | ✅ | Comma-separated origins |
| `OPENAI_API_KEY` | ❌ | Not used (fastembed local) |
| `GROQ_MODEL` | ❌ | Default: `llama-3.3-70b-versatile` |
| `COMPLIANCE_TEMPERATURE` | ❌ | Default: `0.2` |

### Frontend (`frontend/.env`)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Web (`web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## 🗃 Database Schema (Key Tables)

```sql
-- RAG Knowledge Base
document_chunks (id, source, agency, doc_date, url, chunk_index, content, embedding vector(384))

-- HS Code Search
hs_codes (id, chapter, heading, code, description, notes, embedding vector(384))

-- AfCFTA
afcfta_tariff_schedule (hs_code, destination_country, base_rate, category_a_rate, phase_out_year)
afcfta_roo_requirements (hs_code_prefix, roo_type, roo_description, value_added_threshold)
afcfta_checks (user_id, product_name, hs_code, destination_country, eligible, tariff_saving, roo_eligible, explanation)

-- User Data
profiles (id, user_id, business_name, cac_number, trade_type, ...)
ledger (id, profile_id, product_name, hs_code, status, quantity, value_usd, direction, created_at)
```

**RPC Functions:**
- `match_document_chunks(query_embedding, match_count, filter_agency)` → cosine similarity
- `match_hs_codes(query_embedding, match_count)` → cosine similarity

---

## 🤝 Contributing

### Branching Strategy
- `main` — production-ready, protected
- `develop` — integration branch
- `feature/*` — new features
- `fix/*` — bug fixes
- `docs/*` — documentation only

### Commit Convention (Conventional Commits)
```
feat: add AfCFTA tariff schedule ingestion
fix: handle empty retrieval in compliance_chain
docs: update README with Docker instructions
refactor: extract score calculation to utils/score.ts
test: add reranker truncation warning test
chore: bump fastembed to 0.8.0
```

### Pull Request Checklist
- [ ] All tests pass (`./run.sh test`)
- [ ] TypeScript clean (`npx tsc --noEmit` in frontend)
- [ ] Lint clean (`npm run lint` if configured)
- [ ] No hardcoded secrets
- [ ] Migration SQL included if schema changes
- [ ] Updated relevant docs (README, CHANGELOG)

### Code Style
- **Python**: Ruff (line-length 100, target py311)
- **TypeScript**: ESLint + Prettier (via Expo defaults)
- **SQL**: 2-space indent, UPPER CASE keywords

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| `document_chunks` table missing | Run migrations in Supabase SQL Editor |
| `json.loads(cached)` NameError in afcfta.py | Add `import json` at top of file |
| Groq 429 rate limit | Wait / check quota / add fallback |
| pgvector dimension mismatch | Ensure migration ran (384-dim for fastembed) |
| Expo "Metro bundler ECONNREFUSED" | `npx expo start --clear --lan` |
| Supabase RLS blocking inserts | Check service_role key used for admin ops |
| `fastembed` model download fails | `pip install --upgrade fastembed` + internet |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Nigeria Customs Service** — prohibition lists, CET tariffs
- **AfCFTA Secretariat** — Rules of Origin, tariff schedules
- **CBN** — Form M/NXP, FX Manual 4th Edition
- **NAFDAC** — Registration guidelines, tariffs
- **SON** — MANCAP/SONCAP certification
- **Groq** — Ultra-fast LLM inference
- **fastembed** — Local embeddings without API keys
- **Supabase** — Postgres + pgvector + Auth + Realtime
- **Upstash** — Serverless Redis

---

**Built for Nigerian traders, by people who understand the pain of Form M.** 🇳🇬