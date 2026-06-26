export const API_BASE_URL = "https://agenda-mp-3.onrender.com";

export type User = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  idade?: number | null;
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

export function getCurrentUser(): User | null {
  const rawUser = storage.get("pharmalife:user");
  return rawUser ? JSON.parse(rawUser) : sessionUser;
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
  return raw ? JSON.parse(raw) : sampleHistory;
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
  const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), senha }),
  });

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
  const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...user,
      nome: user.nome.trim(),
      email: user.email.trim(),
      comorbidade: user.comorbidade?.trim() || null,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Nao foi possivel criar a conta."),
    );
  }

  return (await response.json()) as User;
}

export async function fetchMedications(): Promise<Medication[]> {
  const user = getCurrentUser();
  if (!user) return [];

  const agendaRes = await fetch(
    `${API_BASE_URL}/api/usuarios/${user.id}/agenda`,
  );
  if (!agendaRes.ok) return [];

  const agendas = await agendaRes.json();
  if (!agendas || agendas.length === 0) return [];

  const agendaId = agendas[0].id;

  const medRes = await fetch(
    `${API_BASE_URL}/api/agenda/${agendaId}/medicamentos`,
  );
  if (!medRes.ok) return [];

  return (await medRes.json()) as Medication[];
}

export async function addMedication(
  input: Omit<Medication, "id" | "statusMedicamento" | "agenda"> & {
    horario: string;
  },
) {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuario nao autenticado.");

  const agendaRes = await fetch(
    `${API_BASE_URL}/api/usuarios/${user.id}/agenda`,
  );

  if (!agendaRes.ok) {
    throw new Error(await parseApiError(agendaRes, "Erro ao buscar agenda."));
  }

  const agendas = await agendaRes.json();

  let agendaId: number;

  if (!agendas || agendas.length === 0) {
    // Cria agenda automaticamente se não existir
    const createRes = await fetch(
      `${API_BASE_URL}/api/usuarios/${user.id}/agenda`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: "Agenda Principal",
          dosagem: "-",
          observacoes: "",
          horario: "08:00",
          dataInicio: new Date().toISOString().slice(0, 16),
          dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        }),
      },
    );
    if (!createRes.ok) {
      throw new Error(
        await parseApiError(createRes, "Erro ao criar agenda automaticamente."),
      );
    }

    const novaAgenda = await createRes.json();
    agendaId = novaAgenda.id;
  } else {
    agendaId = agendas[0].id;
  }

  const medRes = await fetch(
    `${API_BASE_URL}/api/agenda/${agendaId}/medicamentos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: input.nome,
        descricao: input.descricao,
        tipo: input.tipo,
        complemento: input.complemento ?? "",
        statusMedicamento: "proximo",
      }),
    },
  );

  if (!medRes.ok) {
    throw new Error(await parseApiError(medRes, "Erro ao salvar medicamento."));
  }

  return (await medRes.json()) as Medication;
}

export async function deleteMedication(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/medicamentos/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao deletar medicamento."));
  }
}

export async function markMedicationAsTaken(medication: Medication) {
  const horario =
    medication.agenda?.horario ?? new Date().toTimeString().slice(0, 5);

  // 1. Registra no histórico como PENDENTE
  const registrarRes = await fetch(
    `${API_BASE_URL}/api/agenda/${medication.agenda?.id}/medicamentos/${medication.id}/historico`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: medication.nome,
        dosagem: medication.descricao,
        observacoes: medication.complemento ?? "",
        horario,
      }),
    },
  );

  if (!registrarRes.ok) {
    throw new Error(
      await parseApiError(registrarRes, "Erro ao registrar historico."),
    );
  }

  const historico = await registrarRes.json();

  // 2. Confirma o uso imediatamente
  const confirmarRes = await fetch(
    `${API_BASE_URL}/api/historico/${historico.id}/confirmar`,
    { method: "PATCH" },
  );

  if (!confirmarRes.ok) {
    throw new Error(
      await parseApiError(confirmarRes, "Erro ao confirmar medicamento."),
    );
  }

  const confirmado = await confirmarRes.json();

  // Salva também no localStorage como fallback local
  const entry: HistoryItem = {
    id: confirmado.id,
    nome: confirmado.nome ?? medication.nome,
    dosagem: confirmado.dosagem ?? medication.descricao,
    observacoes: confirmado.observacoes ?? medication.complemento,
    horario: confirmado.horario ?? horario,
    status: "CONFIRMADO",
    dataConfirmacao: new Date().toISOString(),
  };

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

  const res = await fetch(`${API_BASE_URL}/api/usuarios/${user.id}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, senhaAtual, novaSenha }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Erro ao atualizar perfil.");

  // Atualiza nome no storage local
  setStoredUser({ ...user, nome });
  return text;
}
