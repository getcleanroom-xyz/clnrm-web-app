import { get, post } from "./client";
import type { SurveyResults } from "./types";

export interface SurveySubmission {
  role: string;
  use_case: string;
  feature_importance: Record<string, string>;
  must_have: string;
  missing_feature: string;
  price_fairness: string;
  referral: string;
  email: string;
}

export function submitSurvey(data: SurveySubmission) {
  return post<{ ok: boolean }>("/api/survey", data);
}

export function getSurveyResults(signal?: AbortSignal) {
  return get<SurveyResults>("/api/survey/results", signal);
}

export function requestContactOtp(submissionIndex: number, message: string) {
  return post<{ ok: boolean; detail: string }>(
    "/api/survey/contact/request-otp",
    { submission_index: submissionIndex, message },
  );
}

export function verifyContactOtp(token: string, otp: string) {
  return post<{ ok: boolean; detail: string }>(
    "/api/survey/contact/verify",
    { token, otp },
  );
}
