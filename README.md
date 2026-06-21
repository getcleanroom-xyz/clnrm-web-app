# CleanRoom Web App

The Next.js frontend for [CleanRoom](https://cleanroom.sh) — a disposable private browser service paid for with Monero.

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- **VNC:** @novnc/novnc (connects to the backend's WebSocket relay)
- **Icons:** Phosphor Icons
- **Analytics:** Vercel Analytics

## Running locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` by default.

### Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000   # CleanRoom backend URL
```

In production, point this at your deployed backend (e.g. `https://api.cleanroom.sh`).

## Project structure

```
clnrm-web-app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── queue/              # Session queue (waiting, slot assignment)
│   ├── session/            # Active browser session (noVNC viewer)
│   ├── payment/            # Monero payment flow
│   ├── balance/            # Account balance management
│   ├── buy-vouchers/       # Voucher purchase
│   └── survey/             # User survey
├── components/
│   ├── landing/            # Landing page components
│   ├── session/            # Session viewer (noVNC canvas, controls)
│   ├── ui/                 # shadcn/ui primitives
│   └── ...
├── lib/
│   ├── api/                # Backend API client
│   ├── hooks/              # React hooks
│   └── ...
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Key flows

1. **Queue:** User joins a session queue via a JWT token. The backend assigns slots as capacity becomes available.
2. **Payment:** User pays with Monero. After 1 confirmation, the backend mints a session JWT.
3. **Session:** The noVNC viewer connects to `wss://api.cleanroom.sh/stream/{session_id}?token=JWT` and renders the remote browser in a canvas.

## Linting

```bash
npm run lint
```
