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
  options?: { retryNetwork?: boolean },
) {
  const url = apiUrl(path);

  try {
    return await fetch(url, init);
  } catch (error) {
    if (options?.retryNetwork && isFetchNetworkError(error)) {
      await wait(700);

      try {
        return await fetch(url, init);
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
  };
};

export type HistoryItem = {
  id: number;
  nome: string;
  dosagem: string;
  observacoes?: string;
  horario: string;
  status: "PENDENTE" | "CONFIRMADO" | "IGNORADO";
  dataConfirmacao?: string;
  motivoIgnorado?: string;
};

export type Reminder = {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
};

const sampleUser: User = {
  id: 1,
  nome: "Usuario",
  email: "usuario@pharmalife.com",
  idade: 68,
  comorbidade: "Hipertensao",
};

let sessionUser: User | null = null;

export const sampleMedications: Medication[] = [
  {
    id: 1,
    nome: "Losartana",
    descricao: "50mg",
    tipo: "Diario",
    complemento: "Tomar apos o cafe da manha",
    statusMedicamento: "proximo",
    agenda: { id: 1, nome: "Agenda Principal", horario: "08:00" },
  },
  {
    id: 2,
    nome: "Metformina",
    descricao: "850mg",
    tipo: "12h",
    complemento: "Tomar com alimento",
    statusMedicamento: "pendente",
    agenda: { id: 1, nome: "Agenda Principal", horario: "12:00" },
  },
  {
    id: 3,
    nome: "Vitamina D",
    descricao: "2000 UI",
    tipo: "Semanal",
    complemento: "Domingo pela manha",
    statusMedicamento: "aberta",
    agenda: { id: 1, nome: "Agenda Principal", horario: "09:30" },
  },
];

export const sampleHistory: HistoryItem[] = [
  {
    id: 1,
    nome: "Losartana",
    dosagem: "50mg",
    observacoes: "Confirmado pelo paciente",
    horario: "08:00",
    status: "CONFIRMADO",
    dataConfirmacao: new Date().toISOString(),
  },
  {
    id: 2,
    nome: "Metformina",
    dosagem: "850mg",
    observacoes: "Aguardando confirmacao",
    horario: "12:00",
    status: "PENDENTE",
  },
];

export const sampleReminders: Reminder[] = [
  {
    id: 1,
    titulo: "Comprar medicamentos",
    descricao: "Repor os comprimidos da semana",
    data: new Date().toISOString().slice(0, 10),
    horario: "17:00",
  },
];

const storage = {
  get(key: string) {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  },
  set(key: string, value: string) {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.setItem(key, value);
  },
  remove(key: string) {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.removeItem(key);
  },
};

async function parseApiError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const json = JSON.parse(text) as { erro?: string; message?: string };
    return json.erro || json.message || text;
  } catch {
    return text;
  }
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

function normalizeTime(value: unknown, fallback = "--:--") {
  const text = asString(value, fallback);
  return text.length >= 5 ? text.slice(0, 5) : fallback;
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

function normalizeMedication(value: unknown, agendaFallback?: Medication["agenda"]) {
  const medication = asRecord(value);
  const agenda = asRecord(medication.agenda);
  const resolvedAgenda = medication.agenda
    ? {
        id: Number(agenda.id ?? agendaFallback?.id ?? 0),
        nome: asString(agenda.nome, agendaFallback?.nome ?? ""),
        horario: normalizeTime(agenda.horario, agendaFallback?.horario),
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

  return {
    id: Number(item.id),
    nome: asString(item.nome, "Medicamento"),
    dosagem: asString(item.dosagem, ""),
    observacoes: asString(item.observacoes, ""),
    horario: normalizeTime(item.horario),
    status: normalizeHistoryStatus(item.status),
    dataConfirmacao: asOptionalString(item.dataConfirmacao),
    motivoIgnorado: asOptionalString(item.motivoIgnorado),
  } satisfies HistoryItem;
}

function birthDateFromAge(age?: number | null) {
  if (!age || !Number.isFinite(age)) return null;
  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchApi(path, init);

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Erro ao chamar a API."));
  }

  return (await response.json()) as T;
}

export function getCurrentUser(): User | null {
  const rawUser = storage.get("pharmalife:user");
  if (!rawUser) return sessionUser;

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    clearStoredUser();
    return null;
  }
}

export function getStoredUser(): User {
  return getCurrentUser() ?? sampleUser;
}

export function isUserAuthenticated() {
  return Boolean(getCurrentUser());
}

export function setStoredUser(user: User) {
  sessionUser = user;
  storage.set("pharmalife:user", JSON.stringify(user));
}

export function clearStoredUser() {
  sessionUser = null;
  storage.remove("pharmalife:user");
}

export function getStoredHistory(): HistoryItem[] {
  const raw = storage.get("pharmalife:history");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map(normalizeHistoryItem);
  } catch {
    storage.remove("pharmalife:history");
    return [];
  }
}

export function setStoredHistory(history: HistoryItem[]) {
  storage.set("pharmalife:history", JSON.stringify(history));
}

export function getStoredReminders(): Reminder[] {
  const raw = storage.get("pharmalife:reminders");
  return raw ? JSON.parse(raw) : sampleReminders;
}

export function setStoredReminders(reminders: Reminder[]) {
  storage.set("pharmalife:reminders", JSON.stringify(reminders));
}

export async function loginUser(email: string, senha: string) {
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

  const user = (await response.json()) as User;
  setStoredUser(user);
  return user;
}

export async function registerUser(user: Omit<User, "id">) {
  const nome = user.nome.trim();
  const email = user.email.trim();
  const comorbidade = user.comorbidade?.trim() || null;

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

  const createdUser = (await response.json()) as User;
  const dataNascimento = birthDateFromAge(user.idade);

  if (!dataNascimento) return createdUser;

  const onboardingResponse = await fetchApi(
    `/api/usuarios/${createdUser.id}/onboarding`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        dataNascimento,
        comorbidade: comorbidade || "Nao possuo comorbidades",
      }),
    },
  );

  if (!onboardingResponse.ok) {
    throw new Error(
      await parseApiError(
        onboardingResponse,
        "Conta criada, mas nao foi possivel completar o cadastro.",
      ),
    );
  }

  return (await onboardingResponse.json()) as User;
}

export async function fetchMedications(): Promise<Medication[]> {
  const user = getCurrentUser();
  if (!user) return [];

  const agendas = await fetchJson<unknown[]>(
    `/api/usuarios/${user.id}/agenda`,
  );
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
      };

      const medications = await fetchJson<unknown[]>(
        `/api/agenda/${agendaId}/medicamentos`,
      );

      return medications.map((medication) =>
        normalizeMedication(medication, agendaInfo),
      );
    }),
  );

  return medicationLists.flat();
}

export async function addMedication(
  input: Omit<Medication, "id" | "statusMedicamento" | "agenda"> & {
    horario: string;
  },
) {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");

  const normalizedHorario = normalizeTime(input.horario, "08:00");
  const agenda = await fetchJson<Record<string, unknown>>(
    `/api/usuarios/${user.id}/agenda`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: input.nome,
        dosagem: input.descricao,
        observacoes: input.complemento ?? "",
        horario: normalizedHorario,
        dataInicio: new Date().toISOString().slice(0, 16),
        dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
      }),
    },
  );
  const agendaId = Number(agenda.id);

  if (!agendaId) {
    throw new Error("Backend retornou uma agenda sem ID.");
  }

  const medication = await fetchJson<unknown>(
    `/api/agenda/${agendaId}/medicamentos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: input.nome,
        descricao: input.descricao,
        tipo: input.tipo,
        complemento: input.complemento ?? "",
        statusMedicamento: "ATIVO",
      }),
    },
  );
  const normalizedMedication = normalizeMedication(medication, {
    id: agendaId,
    nome: asString(agenda.nome, input.nome),
    horario: normalizedHorario,
  });

  // Agenda notificação no horário cadastrado (só mobile)
  import("./notifications")
    .then(({ scheduleMedicationNotification }) => {
      scheduleMedicationNotification({
        ...normalizedMedication,
        agenda: {
          ...normalizedMedication.agenda,
          id: agendaId,
          horario: normalizedHorario,
        },
      }).catch(() => {});
    })
    .catch(() => {});

  return normalizedMedication;
}

export async function deleteMedication(id: number): Promise<void> {
  const res = await fetchApi(`/api/medicamentos/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao deletar medicamento."));
  }

  // Cancela notificação associada (só mobile)
  import("./notifications")
    .then(({ cancelMedicationNotification }) => {
      cancelMedicationNotification(id).catch(() => {});
    })
    .catch(() => {});
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

export async function ignoreHistoryItem(id: number, motivoIgnorado = "Outro motivo") {
  const item = await fetchJson<unknown>(`/api/historico/${id}/ignorar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivoIgnorado }),
  });
  return normalizeHistoryItem(item);
}

export async function markMedicationAsTaken(medication: Medication) {
  const agendaId = medication.agenda?.id;
  if (!agendaId) {
    throw new Error("Medicamento sem agenda vinculada.");
  }

  const horario =
    medication.agenda?.horario ?? new Date().toTimeString().slice(0, 5);

  const historico = await fetchJson<Record<string, unknown>>(
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

  const confirmado = await fetchJson<unknown>(
    `/api/historico/${historico.id}/confirmar`,
    { method: "PATCH" },
  );

  const entry = normalizeHistoryItem(confirmado);

  const history = getStoredHistory();
  setStoredHistory([entry, ...history]);
  return entry;
}

export function adherencePercent(
  medications: Medication[],
  history: HistoryItem[],
) {
  const expected = medications.length * 7;
  if (expected === 0) return 0;

  return Math.min(
    100,
    Math.round(
      (history.filter((item) => item.status === "CONFIRMADO").length /
        expected) *
        100,
    ),
  );
}

export async function updateProfile(
  nome: string,
  senhaAtual: string,
  novaSenha: string,
): Promise<string> {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");

  const res = await fetchApi(`/api/usuarios/${user.id}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, senhaAtual, novaSenha }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Erro ao atualizar perfil.");

  setStoredUser({ ...user, nome });
  return text;
}
