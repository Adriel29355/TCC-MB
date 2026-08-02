import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  FIELD_LIMITS,
  validateBirthDate,
  validateDosage,
  validateEmail,
  validateHealthCondition,
  validateLoginPassword,
  validateMedicationName,
  validateNewPassword,
  validateOptionalText,
  validatePersonName,
  validateTime,
} from "./validation";

const REMOTE_API_BASE_URL = "https://agenda-mp-3.onrender.com";

const runtime = globalThis as typeof globalThis & {
  __DEV__?: boolean;
  process?: { env?: Record<string, string | undefined> };
};

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const envUrl = runtime.process?.env?.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) return trimTrailingSlash(envUrl);

  return REMOTE_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const NETWORK_ERROR_MESSAGE =
  "Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente.";

function reportIntegrationError(operation: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[pharmalife] ${operation} falhou`, error);
  }
}

function isFetchNetworkError(error: unknown) {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;

  return /fetch|network|request failed|load failed/i.test(error.message);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throwApiNetworkError(error: unknown): never {
  if (isFetchNetworkError(error)) {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  throw error;
}

async function fetchApi(
  path: string,
  init?: RequestInit,
  options?: { retryNetwork?: boolean; authToken?: string },
) {
  const url = apiUrl(path);
  const headers = new Headers(init?.headers);
  const authToken = options?.authToken ?? sessionUser?.authToken;

  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const requestInit = { ...init, headers };

  try {
    return await fetch(url, requestInit);
  } catch (error) {
    if (options?.retryNetwork && isFetchNetworkError(error)) {
      await wait(700);

      try {
        return await fetch(url, requestInit);
      } catch (retryError) {
        throwApiNetworkError(retryError);
      }
    }

    throwApiNetworkError(error);
  }
}

export type User = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  authToken?: string;
  foto?: string | null;
  tipoNotificacao?: string;
  idade?: number | null;
  dataNascimento?: string | null;
  comorbidade?: string | null;
};

export type Medication = {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  complemento?: string;
  statusMedicamento?: string;
  agenda?: {
    id: number;
    nome?: string;
    horario?: string;
    dataInicio?: string;
    dataFim?: string;
  };
};

export type MedicationInput = {
  nome: string;
  descricao: string;
  tipo: string;
  complemento?: string;
  horario: string;
  dataFim?: string;
};

export type HistoryItem = {
  id: number;
  medicationId?: number;
  nome: string;
  dosagem: string;
  observacoes?: string;
  horario: string;
  status: "PENDENTE" | "CONFIRMADO" | "IGNORADO";
  dataConfirmacao?: string;
  dataHoraIgnorado?: string;
  motivoIgnorado?: string;
};

let sessionUser: User | null = null;
let sessionHistory: HistoryItem[] = [];
let sessionHydrated = false;
const sessionListeners = new Set<() => void>();
const USER_STORAGE_KEY = "pharmalife.user";
const LEGACY_WEB_USER_STORAGE_KEY = "pharmalife:user";

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

function getWebSessionStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage ?? null;
}

async function readStoredUserAsync() {
  if (Platform.OS === "web") {
    return getWebSessionStorage()?.getItem(USER_STORAGE_KEY) ?? null;
  }
  return SecureStore.getItemAsync(USER_STORAGE_KEY);
}

async function writeStoredUserAsync(value: string) {
  if (Platform.OS === "web") {
    getWebSessionStorage()?.setItem(USER_STORAGE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(USER_STORAGE_KEY, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function removeStoredUserAsync() {
  if (Platform.OS === "web") {
    getWebSessionStorage()?.removeItem(USER_STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
}

function parseStoredUser(value: string | null): User | null {
  if (!value) return null;
  try {
    const user = normalizeUser(JSON.parse(value));
    return user?.authToken ? user : null;
  } catch {
    return null;
  }
}

export async function hydrateSessionAsync() {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage?.removeItem(LEGACY_WEB_USER_STORAGE_KEY);
      window.localStorage?.removeItem("pharmalife:history");
      window.localStorage?.removeItem("pharmalife:reminders");
    }
    sessionUser = parseStoredUser(await readStoredUserAsync());
  } catch {
    sessionUser = null;
  } finally {
    sessionHydrated = true;
    notifySessionListeners();
  }
}

export function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function isSessionHydrated() {
  return sessionHydrated;
}

async function parseApiError(response: Response, fallback: string) {
  if (response.status >= 500) return fallback;
  const text = await response.text();
  if (!text) return fallback;

  let candidate = text;
  try {
    const json = JSON.parse(text) as { erro?: string; message?: string };
    candidate = json.erro || json.message || fallback;
  } catch {}

  const sanitized = candidate
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    !sanitized ||
    sanitized.length > 180 ||
    /exception|stack\s*trace|org\.springframework|java\.|\bat\s+[\w.$]+\(/i.test(
      sanitized,
    )
  ) {
    return fallback;
  }
  return sanitized;
}

function assertValid(error: string) {
  if (error) throw new Error(error);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function normalizeUser(value: unknown): User | null {
  const user = asRecord(value);
  const id = Number(user.id);
  const nome = asString(user.nome).trim();
  const email = asString(user.email).trim();
  if (!Number.isFinite(id) || id <= 0 || !nome || !email) return null;

  const idade = Number(user.idade);
  return {
    id,
    nome,
    email,
    authToken: asOptionalString(user.authToken),
    foto: asOptionalString(user.foto) ?? null,
    tipoNotificacao: asOptionalString(user.tipoNotificacao) ?? "sistema",
    idade: Number.isFinite(idade) ? idade : null,
    dataNascimento: asOptionalString(user.dataNascimento) ?? null,
    comorbidade: asOptionalString(user.comorbidade) ?? null,
  };
}

function normalizeTime(value: unknown, fallback = "--:--") {
  const text = asString(value, fallback);
  return text.length >= 5 ? text.slice(0, 5) : fallback;
}

function normalizeMedicationInputTime(value: string) {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("Informe o horario no formato HH:mm.");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error("Informe um horario valido entre 00:00 e 23:59.");
  }

  return `${match[1]}:${match[2]}`;
}

function toLocalDateTimeString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

function normalizeTreatmentEndDate(value: string | undefined, startDate: Date) {
  if (!value) {
    return toLocalDateTimeString(new Date(2100, 11, 31, 23, 59, 59));
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) throw new Error("A data final do tratamento e invalida.");

  const endDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );
  if (
    endDate.getFullYear() !== Number(match[1]) ||
    endDate.getMonth() !== Number(match[2]) - 1 ||
    endDate.getDate() !== Number(match[3]) ||
    endDate.getHours() !== Number(match[4]) ||
    endDate.getMinutes() !== Number(match[5]) ||
    endDate.getSeconds() !== Number(match[6]) ||
    endDate <= startDate
  ) {
    throw new Error("A data final precisa ser posterior ao inicio do tratamento.");
  }

  return toLocalDateTimeString(endDate);
}

function normalizeHistoryStatus(status: unknown): HistoryItem["status"] {
  const normalized = asString(status).trim().toUpperCase();

  if (normalized === "TOMADO" || normalized === "CONFIRMADO") {
    return "CONFIRMADO";
  }

  if (normalized === "IGNORADO" || normalized === "PERDIDO") {
    return "IGNORADO";
  }

  return "PENDENTE";
}

function normalizeMedication(
  value: unknown,
  agendaFallback?: Medication["agenda"],
) {
  const medication = asRecord(value);
  const agenda = asRecord(medication.agenda);
  const resolvedAgenda = medication.agenda
    ? {
        id: Number(agenda.id ?? agendaFallback?.id ?? 0),
        nome: asString(agenda.nome, agendaFallback?.nome ?? ""),
        horario: normalizeTime(agenda.horario, agendaFallback?.horario),
        dataInicio:
          asOptionalString(agenda.dataInicio) ?? agendaFallback?.dataInicio,
        dataFim: asOptionalString(agenda.dataFim) ?? agendaFallback?.dataFim,
      }
    : agendaFallback;

  return {
    id: Number(medication.id),
    nome: asString(medication.nome, "Medicamento"),
    descricao: asString(medication.descricao, ""),
    tipo: asString(medication.tipo, ""),
    complemento: asString(medication.complemento, ""),
    statusMedicamento: asString(medication.statusMedicamento, "ATIVO"),
    agenda: resolvedAgenda,
  } satisfies Medication;
}

function normalizeHistoryItem(value: unknown) {
  const item = asRecord(value);
  const medication = asRecord(item.medicamento ?? item.medication);
  const medicationId = Number(
    item.medicationId ??
      item.medicamentoId ??
      item.idMedicamento ??
      medication.id,
  );

  return {
    id: Number(item.id),
    medicationId:
      Number.isInteger(medicationId) && medicationId > 0
        ? medicationId
        : undefined,
    nome: asString(item.nome, "Medicamento"),
    dosagem: asString(item.dosagem, ""),
    observacoes: asString(item.observacoes, ""),
    horario: normalizeTime(item.horario),
    status: normalizeHistoryStatus(item.status),
    dataConfirmacao: asOptionalString(item.dataConfirmacao),
    dataHoraIgnorado:
      asOptionalString(item.dataHoraIgnorado) ??
      (normalizeHistoryStatus(item.status) === "IGNORADO"
        ? asOptionalString(item.updatedAt ?? item.dataAtualizacao)
        : undefined),
    motivoIgnorado: asOptionalString(item.motivoIgnorado),
  } satisfies HistoryItem;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchApi(path, init);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Erro ao chamar a API."));
  }

  return (await response.json()) as T;
}

export function getCurrentUser(): User | null {
  return sessionUser;
}

export function getStoredUser(): User {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");
  return user;
}

export function isUserAuthenticated() {
  return Boolean(getCurrentUser());
}

export async function setStoredUser(user: User) {
  try {
    const { senha: _senha, ...safeUser } = user;
    await writeStoredUserAsync(
      JSON.stringify(safeUser),
    );
  } catch {
    throw new Error("Nao foi possivel proteger a sessao neste aparelho.");
  }
  sessionUser = user;
  notifySessionListeners();
}

export async function clearStoredUser() {
  try {
    await removeStoredUserAsync();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage?.removeItem(LEGACY_WEB_USER_STORAGE_KEY);
      window.localStorage?.removeItem("pharmalife:history");
      window.localStorage?.removeItem("pharmalife:reminders");
    }
  } catch {
    throw new Error("Nao foi possivel remover a sessao deste aparelho.");
  }
  sessionUser = null;
  sessionHistory = [];
  notifySessionListeners();
}

export function getStoredHistory(): HistoryItem[] {
  return sessionHistory;
}

export function setStoredHistory(history: HistoryItem[]) {
  sessionHistory = history;
}

export async function loginUser(email: string, senha: string) {
  assertValid(validateEmail(email));
  assertValid(validateLoginPassword(senha));
  const response = await fetchApi(
    "/api/usuarios/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), senha }),
    },
    { retryNetwork: true },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Email ou senha incorretos."),
    );
  }

  const user = normalizeUser(await response.json());
  if (!user) throw new Error("O servidor retornou um usuario invalido.");
  await setStoredUser(user);
  return user;
}

type RegisterUserInput = Omit<User, "id" | "idade" | "dataNascimento"> & {
  dataNascimento: string;
};

export async function registerUser(user: RegisterUserInput) {
  const nome = user.nome.trim();
  const email = user.email.trim();
  const comorbidade = user.comorbidade?.trim() || null;

  assertValid(validatePersonName(nome));
  assertValid(validateEmail(email));
  assertValid(validateNewPassword(user.senha ?? ""));
  assertValid(validateHealthCondition(comorbidade ?? ""));
  assertValid(
    validateBirthDate(user.dataNascimento.split("-").reverse().join("/")),
  );

  const response = await fetchApi("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...user,
      nome,
      email,
      comorbidade,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Nao foi possivel criar a conta."),
    );
  }

  const createdUser = normalizeUser(await response.json());
  if (!createdUser) throw new Error("O servidor retornou um usuario invalido.");

  const onboardingResponse = await fetchApi(
    `/api/usuarios/${createdUser.id}/onboarding`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        dataNascimento: user.dataNascimento,
        comorbidade: comorbidade || "Nao possuo comorbidades",
      }),
    },
    { authToken: createdUser.authToken },
  );

  if (!onboardingResponse.ok) {
    const onboardingError = await parseApiError(
      onboardingResponse,
      "Nao foi possivel completar o cadastro.",
    );
    const rollbackResponse = await fetchApi(
      `/api/usuarios/${createdUser.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual: user.senha }),
      },
      { authToken: createdUser.authToken },
    ).catch(() => null);

    if (!rollbackResponse?.ok) {
      throw new Error(
        `A conta foi criada, mas o cadastro ficou incompleto. Tente entrar com o e-mail informado ou recupere a conta. Detalhe: ${onboardingError}`,
      );
    }

    throw new Error(`${onboardingError} A criacao da conta foi desfeita.`);
  }

  const onboardedUser = normalizeUser(await onboardingResponse.json());
  if (!onboardedUser) {
    throw new Error("O servidor retornou um usuario invalido.");
  }
  return { ...onboardedUser, authToken: createdUser.authToken };
}

export async function fetchMedications(): Promise<Medication[]> {
  const user = getCurrentUser();
  if (!user) return [];

  const agendas = await fetchJson<unknown[]>(`/api/usuarios/${user.id}/agenda`);
  if (!agendas || agendas.length === 0) return [];

  const medicationLists = await Promise.all(
    agendas.map(async (agendaValue) => {
      const agenda = asRecord(agendaValue);
      const agendaId = Number(agenda.id);
      if (!agendaId) return [];

      const agendaInfo = {
        id: agendaId,
        nome: asString(agenda.nome, "Agenda"),
        horario: normalizeTime(agenda.horario),
        dataInicio: asOptionalString(agenda.dataInicio),
        dataFim: asOptionalString(agenda.dataFim),
      };

      const medications = await fetchJson<unknown[]>(
        `/api/agenda/${agendaId}/medicamentos`,
      );

      return medications.map((medication) =>
        normalizeMedication(medication, agendaInfo),
      );
    }),
  );

  const medications = medicationLists.flat();

  import("./notifications")
    .then(({ syncMedicationNotifications }) =>
      syncMedicationNotifications(medications),
    )
    .catch((error) =>
      reportIntegrationError("sincronizacao de notificacoes", error),
    );

  return medications;
}

export async function fetchMedicationById(id: number): Promise<Medication> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Medicamento invalido.");
  }
  const medication = normalizeMedication(
    await fetchJson<unknown>(`/api/medicamentos/${id}`),
  );
  if (!medication.id || !medication.agenda?.id) {
    throw new Error("O medicamento nao possui uma agenda valida.");
  }
  return medication;
}

export async function addMedication(
  input: MedicationInput,
) {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");

  const nome = input.nome.trim();
  const descricao = input.descricao.trim();
  assertValid(validateMedicationName(nome));
  assertValid(validateDosage(descricao));
  assertValid(validateTime(input.horario));
  assertValid(
    validateOptionalText(
      input.complemento ?? "",
      "A observacao",
      FIELD_LIMITS.medicationObservation,
    ),
  );

  const normalizedHorario = normalizeMedicationInputTime(input.horario);
  const startDate = new Date();
  const dataInicio = toLocalDateTimeString(startDate);
  const dataFim = normalizeTreatmentEndDate(input.dataFim, startDate);
  const agenda = await fetchJson<Record<string, unknown>>(
    `/api/usuarios/${user.id}/agenda`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        dosagem: descricao,
        observacoes: input.complemento?.trim() ?? "",
        horario: normalizedHorario,
        dataInicio,
        dataFim,
      }),
    },
  );
  const agendaId = Number(agenda.id);

  if (!agendaId) {
    throw new Error("Backend retornou uma agenda sem ID.");
  }

  let medication: unknown;
  try {
    medication = await fetchJson<unknown>(
      `/api/agenda/${agendaId}/medicamentos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao,
          tipo: input.tipo,
          complemento: input.complemento?.trim() ?? "",
          statusMedicamento: "ATIVO",
        }),
      },
    );
  } catch (error) {
    // Evita deixar uma agenda vazia se a segunda etapa do cadastro falhar.
    await fetchApi(`/api/agenda/${agendaId}`, { method: "DELETE" }).catch(
      () => {},
    );
    throw error;
  }
  const normalizedMedication = normalizeMedication(medication, {
    id: agendaId,
    nome: asString(agenda.nome, nome),
    horario: normalizedHorario,
    dataInicio: asOptionalString(agenda.dataInicio) ?? dataInicio,
    dataFim: asOptionalString(agenda.dataFim) ?? dataFim,
  });

  let notificationScheduled = false;
  try {
    const { scheduleMedicationNotification } = await import("./notifications");
    const scheduled = await scheduleMedicationNotification({
        ...normalizedMedication,
        agenda: {
          ...normalizedMedication.agenda,
          id: agendaId,
          horario: normalizedHorario,
        },
      });
    notificationScheduled = Boolean(scheduled?.length);
  } catch (error) {
    reportIntegrationError("agendamento da notificacao", error);
  }

  return { medication: normalizedMedication, notificationScheduled };
}

export async function updateMedication(
  existing: Medication,
  input: MedicationInput,
) {
  if (!getCurrentUser()) throw new Error("Usuario nao autenticado.");
  if (!existing.id || !existing.agenda?.id) {
    throw new Error("O medicamento nao possui uma agenda valida.");
  }

  const nome = input.nome.trim();
  const descricao = input.descricao.trim();
  const complemento = input.complemento?.trim() ?? "";
  assertValid(validateMedicationName(nome));
  assertValid(validateDosage(descricao));
  assertValid(validateTime(input.horario));
  assertValid(
    validateOptionalText(
      complemento,
      "A observacao",
      FIELD_LIMITS.medicationObservation,
    ),
  );

  const horario = normalizeMedicationInputTime(input.horario);
  const now = new Date();
  const dataInicio = existing.agenda.dataInicio ?? toLocalDateTimeString(now);
  const previousDataFim =
    existing.agenda.dataFim ?? normalizeTreatmentEndDate(undefined, now);
  const dataFim = input.dataFim
    ? normalizeTreatmentEndDate(input.dataFim, now)
    : previousDataFim;
  const agendaId = existing.agenda.id;
  const previousAgendaPayload = {
    nome: existing.agenda.nome ?? existing.nome,
    dosagem: existing.descricao,
    observacoes: existing.complemento ?? "",
    horario: existing.agenda.horario ?? horario,
    dataInicio,
    dataFim: previousDataFim,
  };
  const nextAgendaPayload = {
    nome,
    dosagem: descricao,
    observacoes: complemento,
    horario,
    dataInicio,
    dataFim,
  };

  const updatedAgenda = await fetchJson<Record<string, unknown>>(
    `/api/agenda/${agendaId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextAgendaPayload),
    },
  );

  let updatedMedicationValue: unknown;
  try {
    updatedMedicationValue = await fetchJson<unknown>(
      `/api/medicamentos/${existing.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao,
          tipo: input.tipo,
          complemento,
          statusMedicamento: existing.statusMedicamento ?? "ATIVO",
        }),
      },
    );
  } catch (error) {
    await fetchApi(`/api/agenda/${agendaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previousAgendaPayload),
    }).catch(() => {});
    throw error;
  }

  const medication = normalizeMedication(updatedMedicationValue, {
    id: agendaId,
    nome: asString(updatedAgenda.nome, nome),
    horario: normalizeTime(updatedAgenda.horario, horario),
    dataInicio: asOptionalString(updatedAgenda.dataInicio) ?? dataInicio,
    dataFim: asOptionalString(updatedAgenda.dataFim) ?? dataFim,
  });

  let notificationScheduled = false;
  try {
    const { cancelMedicationNotification, scheduleMedicationNotification } =
      await import("./notifications");
    await cancelMedicationNotification(existing.id);
    const scheduled = await scheduleMedicationNotification(medication);
    notificationScheduled = Boolean(scheduled?.length);
  } catch (error) {
    reportIntegrationError("atualizacao da notificacao", error);
  }

  return { medication, notificationScheduled };
}

export async function deleteMedication(medication: Medication): Promise<void> {
  const res = await fetchApi(`/api/medicamentos/${medication.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao deletar medicamento."));
  }

  // Cancela todos os horarios associados ao medicamento removido.
  try {
    const { cancelMedicationNotification } = await import("./notifications");
    await cancelMedicationNotification(medication.id);
  } catch (error) {
    reportIntegrationError("cancelamento da notificacao", error);
  }

  const agendaId = medication.agenda?.id;
  if (!agendaId) return;

  // Cada cadastro cria uma agenda. Remove-a somente se estiver realmente vazia.
  try {
    const remainingMedications = await fetchJson<unknown[]>(
      `/api/agenda/${agendaId}/medicamentos`,
    );
    if (remainingMedications.length === 0) {
      await fetchApi(`/api/agenda/${agendaId}`, { method: "DELETE" });
    }
  } catch (error) {
    reportIntegrationError("remocao da agenda vazia", error);
  }
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const user = getCurrentUser();
  if (!user) return [];

  const history = await fetchJson<unknown[]>(
    `/api/usuarios/${user.id}/historico`,
  );
  const normalized = history.map(normalizeHistoryItem);
  setStoredHistory(normalized);
  return normalized;
}

export async function confirmHistoryItem(id: number) {
  const item = await fetchJson<unknown>(`/api/historico/${id}/confirmar`, {
    method: "PATCH",
  });
  return normalizeHistoryItem(item);
}

export async function ignoreHistoryItem(
  id: number,
  motivoIgnorado: string,
) {
  const normalizedReason = motivoIgnorado.trim();
  if (!normalizedReason) {
    throw new Error("Informe por que deseja ignorar este medicamento.");
  }
  assertValid(
    validateOptionalText(
      normalizedReason,
      "O motivo",
      FIELD_LIMITS.ignoreReason,
    ),
  );

  const item = await fetchJson<unknown>(`/api/historico/${id}/ignorar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivoIgnorado: normalizedReason }),
  });
  const normalized = normalizeHistoryItem(item);
  return {
    ...normalized,
    dataHoraIgnorado: normalized.dataHoraIgnorado ?? new Date().toISOString(),
    motivoIgnorado: normalized.motivoIgnorado ?? normalizedReason,
  };
}

async function createPendingMedicationHistory(
  medication: Medication,
  occurrenceTime?: string,
) {
  const agendaId = medication.agenda?.id;
  if (!agendaId) {
    throw new Error("Medicamento sem agenda vinculada.");
  }

  const horario =
    occurrenceTime ??
    medication.agenda?.horario ??
    new Date().toTimeString().slice(0, 5);

  return fetchJson<Record<string, unknown>>(
    `/api/agenda/${agendaId}/medicamentos/${medication.id}/historico`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: medication.nome,
        dosagem: medication.descricao,
        observacoes: medication.complemento ?? "",
        horario,
        status: "PENDENTE",
      }),
    },
  );
}

export async function markMedicationAsTaken(
  medication: Medication,
  occurrenceTime?: string,
) {
  const historico = await createPendingMedicationHistory(
    medication,
    occurrenceTime,
  );

  const confirmado = await fetchJson<unknown>(
    `/api/historico/${historico.id}/confirmar`,
    { method: "PATCH" },
  );

  const entry = {
    ...normalizeHistoryItem(confirmado),
    medicationId: medication.id,
  };

  const history = getStoredHistory();
  setStoredHistory([entry, ...history]);
  return entry;
}

export async function markMedicationAsIgnored(
  medication: Medication,
  motivoIgnorado: string,
  occurrenceTime?: string,
) {
  const historico = await createPendingMedicationHistory(
    medication,
    occurrenceTime,
  );
  const ignored = await ignoreHistoryItem(Number(historico.id), motivoIgnorado);
  const entry = {
    ...ignored,
    medicationId: medication.id,
  };

  const history = getStoredHistory();
  setStoredHistory([entry, ...history]);
  return entry;
}

function historyEventDate(item: HistoryItem) {
  const value =
    item.status === "IGNORADO"
      ? item.dataHoraIgnorado ?? item.dataConfirmacao
      : item.dataConfirmacao;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizedFrequency(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "")
    .toLowerCase();
}

function scheduledMinutes(medication: Medication) {
  const time = medication.agenda?.horario?.match(/^(\d{2}):(\d{2})/);
  const baseMinutes = time ? Number(time[1]) * 60 + Number(time[2]) : 0;
  const frequency = normalizedFrequency(medication.tipo);
  const interval =
    frequency === "8h" || frequency.includes("8em8")
      ? 8 * 60
      : frequency === "12h" || frequency.includes("12em12")
        ? 12 * 60
        : null;

  if (!interval) return [baseMinutes];

  const times = new Set<number>();
  for (let offset = 0; offset < 24 * 60; offset += interval) {
    times.add((baseMinutes + offset) % (24 * 60));
  }
  return [...times].sort((left, right) => left - right);
}

export function medicationOccurrencesForDay(
  medication: Medication,
  dayValue: Date,
) {
  if (medication.statusMedicamento === "INATIVO") return [];

  const day = new Date(dayValue);
  day.setHours(0, 0, 0, 0);
  const agendaStart = medication.agenda?.dataInicio
    ? new Date(medication.agenda.dataInicio)
    : null;
  const agendaEnd = medication.agenda?.dataFim
    ? new Date(medication.agenda.dataFim)
    : null;
  const validStart = agendaStart && !Number.isNaN(agendaStart.getTime());
  const validEnd = agendaEnd && !Number.isNaN(agendaEnd.getTime());

  const frequency = normalizedFrequency(medication.tipo);
  if (frequency.startsWith("seman") && validStart) {
    const reference = new Date(agendaStart);
    reference.setHours(0, 0, 0, 0);
    const difference = Math.round(
      (day.getTime() - reference.getTime()) / 86_400_000,
    );
    if (difference < 0 || difference % 7 !== 0) return [];
  }

  return scheduledMinutes(medication)
    .map((minutes) => {
      const occurrence = new Date(day);
      occurrence.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return occurrence;
    })
    .filter(
      (occurrence) =>
        (!validStart || occurrence >= agendaStart) &&
        (!validEnd || occurrence <= agendaEnd),
    );
}

function expectedDosesInLastSevenDays(medication: Medication, now: Date) {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 6);
  windowStart.setHours(0, 0, 0, 0);

  const agendaStart = medication.agenda?.dataInicio
    ? new Date(medication.agenda.dataInicio)
    : null;
  const agendaEnd = medication.agenda?.dataFim
    ? new Date(medication.agenda.dataFim)
    : null;
  const firstDay = new Date(windowStart);

  if (agendaStart && !Number.isNaN(agendaStart.getTime()) && agendaStart > firstDay) {
    firstDay.setFullYear(
      agendaStart.getFullYear(),
      agendaStart.getMonth(),
      agendaStart.getDate(),
    );
  }
  firstDay.setHours(0, 0, 0, 0);

  const lastMoment =
    agendaEnd && !Number.isNaN(agendaEnd.getTime()) && agendaEnd < now
      ? agendaEnd
      : now;
  if (firstDay > lastMoment) return 0;

  let expected = 0;

  for (const day = new Date(firstDay); day <= lastMoment; day.setDate(day.getDate() + 1)) {
    expected += medicationOccurrencesForDay(medication, day).filter(
      (occurrence) => occurrence <= lastMoment,
    ).length;
  }

  return expected;
}

export function adherencePercent(
  medications: Medication[],
  history: HistoryItem[],
) {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 6);
  windowStart.setHours(0, 0, 0, 0);

  const belongsToCurrentMedication = (item: HistoryItem) =>
    item.medicationId
      ? medications.some((medication) => medication.id === item.medicationId)
      : medications.some(
          (medication) =>
            medication.nome.trim().toLocaleLowerCase() ===
            item.nome.trim().toLocaleLowerCase(),
        );

  const eventsInWindow = history.filter((item) => {
    const eventDate = historyEventDate(item);
    return (
      eventDate &&
      eventDate >= windowStart &&
      eventDate <= now &&
      belongsToCurrentMedication(item)
    );
  });
  const confirmedInWindow = eventsInWindow.filter(
    (item) => item.status === "CONFIRMADO",
  ).length;
  const ignoredInWindow = eventsInWindow.filter(
    (item) => item.status === "IGNORADO",
  ).length;
  const scheduledDoses = medications.reduce(
    (total, medication) => total + expectedDosesInLastSevenDays(medication, now),
    0,
  );
  const eligibleDoses = Math.max(0, scheduledDoses - ignoredInWindow);
  if (eligibleDoses === 0) return 0;

  return Math.min(
    100,
    Math.round((Math.min(confirmedInWindow, eligibleDoses) / eligibleDoses) * 100),
  );
}

export async function updateHealthProfile(
  dataNascimento: string,
  comorbidade: string,
) {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");

  const normalizedComorbidity = comorbidade.trim() || "Nao possuo comorbidades";
  assertValid(
    validateBirthDate(dataNascimento.split("-").reverse().join("/")),
  );
  assertValid(validateHealthCondition(normalizedComorbidity));

  const response = await fetchApi(`/api/usuarios/${user.id}/onboarding`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: user.nome,
      dataNascimento,
      comorbidade: normalizedComorbidity,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Erro ao atualizar os dados de saude."),
    );
  }

  const updatedUser = normalizeUser(await response.json());
  if (!updatedUser) throw new Error("O servidor retornou um usuario invalido.");

  const sessionUpdate = {
    ...updatedUser,
    authToken: updatedUser.authToken ?? user.authToken,
  };
  await setStoredUser(sessionUpdate);
  return sessionUpdate;
}

export async function updateProfile(
  nome: string,
  senhaAtual: string,
  novaSenha: string,
): Promise<string> {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");
  const normalizedName = nome.trim();
  assertValid(validatePersonName(normalizedName));
  assertValid(validateLoginPassword(senhaAtual));
  if (novaSenha) assertValid(validateNewPassword(novaSenha));

  const res = await fetchApi(`/api/usuarios/${user.id}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: normalizedName, senhaAtual, novaSenha }),
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao atualizar perfil."));
  }
  const text = await res.text();

  await setStoredUser({ ...user, nome: normalizedName });
  return text;
}

export async function deleteAccount(senhaAtual: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");
  assertValid(validateLoginPassword(senhaAtual));

  const response = await fetchApi(`/api/usuarios/${user.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senhaAtual }),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        response.status === 401
          ? "Senha atual incorreta."
          : "Nao foi possivel excluir a conta.",
      ),
    );
  }
}
