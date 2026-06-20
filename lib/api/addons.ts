import { get } from "./client";
import type { AddonsResponse, ExitCountry, PersonasResponse } from "./types";

export function getAddons(signal?: AbortSignal) {
  return get<AddonsResponse>("/api/addons", signal);
}

export function getExitCountries(signal?: AbortSignal) {
  return get<ExitCountry[]>("/api/addons/exit-countries", signal);
}

export function getPersonas(signal?: AbortSignal) {
  return get<PersonasResponse>("/api/addons/personas", signal);
}
