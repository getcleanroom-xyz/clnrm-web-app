import { post } from "./client";

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
