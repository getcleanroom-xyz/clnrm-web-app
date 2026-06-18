// ── Enums ──

export type SessionStatus = "creating" | "ready" | "destroying" | "dead";
export type QueueStatus = "waiting" | "slot_assigned" | "confirmed" | "abandoned";
export type TokenStatus = "pending" | "confirmed" | "expired";

// ── API Responses ──

export interface HealthResponse {
  status: "ok" | "degraded";
  active_sessions: number;
  max_sessions: number;
  docker_connected: boolean;
  payment_system_available: boolean;
}

export interface QuoteRequest {
  duration_seconds: number;
}

export interface QuoteResponse {
  payment_id: string;
  integrated_address: string;
  xmr_amount: number;
  xmr_amount_display: string;
  usd_amount: number;
  duration_seconds: number;
  duration_label: string;
  expires_at: string;
  instructions: string;
}

export interface TokenCheckResponse {
  status: TokenStatus;
  token?: string | null;
}

export interface JoinRequest {
  token: string;
  push_subscription?: string | null;
}

export interface JoinResponse {
  session_request_id: string;
  position: number;
  waiting_count: number;
  estimated_wait_seconds: number | null;
}

export interface HeartbeatRequest {
  session_request_id: string;
}

export interface HeartbeatResponse {
  session_request_id: string;
  position: number;
  status: "slot_assigned" | "waiting";
}

export interface StatusResponse {
  session_request_id: string;
  position: number | null;
  status: QueueStatus;
  slot_expires_at: string | null;
}

export interface ConfirmRequest {
  session_request_id: string;
}

export interface ConfirmResponse {
  session_id: string;
  status: SessionStatus;
  stream_url: string;
  expires_at: string | null;
}

export interface CreateSessionResponse {
  session_id: string;
  status: SessionStatus;
  expires_at: string | null;
  stream_url: string;
}

export interface SessionStatusResponse {
  session_id: string;
  status: SessionStatus;
  age_seconds: number;
  expires_at: string | null;
}

export interface SystemMetrics {
  timestamp: number;
  host_memory_total_mb: number;
  host_memory_available_mb: number;
  host_memory_used_percent: number;
  zram_compressed_mb: number | null;
  active_sessions: number;
  max_sessions: number;
  sessions: SessionMetrics[];
}

export interface SessionMetrics {
  session_id: string;
  status: SessionStatus;
  age_seconds: number;
  memory_used_bytes: number | null;
  memory_limit_bytes: number;
  cpu_throttle_percent: number | null;
}

// ── WebSocket Messages ──

export type QueueWSClientMessage =
  | { type: "heartbeat" }
  | { session_request_id: string };

export type QueueWSServerMessage =
  | { type: "position"; position: number; status: QueueStatus }
  | { type: "heartbeat_ack"; position: number }
  | { type: "slot_open"; message: string; session_request_id: string; slot_expires_at: string | null }
  | { type: "error"; message: string };

export type StreamInputEvent =
  | { type: "tap"; x: number; y: number; screen_width?: number; screen_height?: number }
  | { type: "key"; keycode: number }
  | { type: "text"; text: string }
  | { type: "ping" };

// ── Survey ──

export interface SurveyResults {
  total: number;
  roles: Record<string, number>;
  feature_scores: Record<string, number>;
  feature_distribution: Record<string, Record<string, number>>;
  price_fairness: Record<string, number>;
  referrals: Record<string, number>;
  top_must_haves: string[];
  roadmap: RoadmapPhase[];
  recent: AnonymizedSubmission[];
}

export interface RoadmapPhase {
  phase: number;
  label: string;
  features: RoadmapFeature[];
}

export interface RoadmapFeature {
  id: string;
  label: string;
  deps: string[];
  importance: number;
}

export interface AnonymizedSubmission {
  index: number;
  submitted_at: string;
  role: string;
  use_case: string;
  feature_importance: Record<string, string>;
  must_have: string;
  missing_feature: string;
  price_fairness: string;
  referral: string;
  email_masked: string | null;
}

// ── Balance ──

export interface BalanceDepositResponse {
  payment_id: string;
  integrated_address: string;
  expires_at: string;
  balance_token: string;
  instructions: string;
}

export interface BalanceResponse {
  payment_id: string;
  balance_xmr: number;
  balance_xmr_display: string;
  total_deposited_xmr: number;
  total_spent_xmr: number;
  can_afford_30min: boolean;
  xmr_usd_price: number | null;
}

export interface BalancePayResponse {
  token: string;
  duration_seconds: number;
  duration_label: string;
  charge_xmr: number;
  remaining_balance_xmr: number;
}

// ── Vouchers ──

export interface VoucherListingPublic {
  id: string;
  title: string;
  description: string;
  value_usd: number;
  value_xmr_estimated: number | null;
  value_xmr_display: string | null;
  accepted_payments: string[];
  external_url: string;
  platform_name: string;
  platform_logo_url: string | null;
  featured: boolean;
}

export interface VoucherListingsResponse {
  items: VoucherListingPublic[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface RedeemVoucherRequest {
  code: string;
  payment_id: string;
}

export interface RedeemVoucherResponse {
  value_usd: number;
  value_xmr_display: string;
  new_balance_xmr_display: string;
  payment_id: string;
}
