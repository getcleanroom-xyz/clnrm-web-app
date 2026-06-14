import { post } from "./client";

export interface SurveySubmission {
  role: string;
  use_case: string;
  features: string[];
  concern: string;
  price_range: string;
  email: string;
}

export function submitSurvey(data: SurveySubmission) {
  return post<{ ok: boolean }>("/api/survey", data);
}
