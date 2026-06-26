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
type Agenda = {
  id: number;
  nome: string;
  dosagem: string;
  horario: string;
  observacoes: string;
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
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key);
  },
  set(key: string, value: string) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  remove(key: string) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

async function parseApiError(response: Response, fallback: string) {
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const json = JSON.parse(text) as { erro?: string; message?: string };
    return json.erro || json.message || text;
  } catch {
    return text;
  }
}
async function getUserAgenda(): Promise<Agenda> {
  const user = getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/usuarios/${user.id}/agenda`
  );

  if (!response.ok) {
    throw new Error("Não foi possível localizar a agenda.");
  }

  const agendas = (await response.json()) as Agenda[];

  if (agendas.length === 0) {
    throw new Error("Usuário não possui agenda.");
  }

  return agendas[0];
}
export function getCurrentUser(): User | null {
  const rawUser = storage.get("pharmalife:user");
  return rawUser ? JSON.parse(rawUser) : sessionUser;
}

export function getStoredUser(): User {
  const user = getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user;
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

export async function getStoredMedications() {

  const agenda = await getUserAgenda();

  const response = await fetch(
    `${API_BASE_URL}/api/agenda/${agenda.id}/medicamentos`
  );

  if (!response.ok) {
    throw new Error("Erro ao carregar medicamentos.");
  }

  return (await response.json()) as Medication[];
}
export function setStoredMedications(medications: Medication[]) {
  storage.set("pharmalife:medications", JSON.stringify(medications));
}
export async function getStoredHistory(): Promise<HistoryItem[]> {
  const user = getStoredUser();

  const response = await fetch(
    `${API_BASE_URL}/api/usuarios/${user.id}/historico`
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "Erro ao carregar histórico.")
    );
  }

  return (await response.json()) as HistoryItem[];
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

export async function addMedication(
  input: {
    nome: string;
    descricao: string;
    tipo: string;
    complemento?: string;
    horario: string;
  },
) {

  const agenda = await getUserAgenda();

  const response = await fetch(
    `${API_BASE_URL}/api/agenda/${agenda.id}/medicamentos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: input.nome,
        descricao: input.descricao,
        tipo: input.tipo,
        complemento: input.complemento,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        "Não foi possível cadastrar medicamento."
      )
    );
  }

  return await response.json();
}
export async function markMedicationAsTaken(
  medication: Medication
): Promise<HistoryItem> {

  const agenda = await getUserAgenda();

  // 1 - registra no histórico

  const registrar = await fetch(
    `${API_BASE_URL}/api/agenda/${agenda.id}/medicamentos/${medication.id}/historico`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: medication.nome,
        dosagem: medication.descricao,
        observacoes: medication.complemento ?? "",
        horario: medication.agenda?.horario ?? "08:00",
      }),
    }
  );

  if (!registrar.ok) {
    throw new Error(
      await parseApiError(
        registrar,
        "Erro ao registrar histórico."
      )
    );
  }

  const historico = (await registrar.json()) as HistoryItem;

  // 2 - confirma o uso

  const confirmar = await fetch(
    `${API_BASE_URL}/api/historico/${historico.id}/confirmar`,
    {
      method: "PATCH",
    }
  );

  if (!confirmar.ok) {
    throw new Error(
      await parseApiError(
        confirmar,
        "Erro ao confirmar medicamento."
      )
    );
  }

  return (await confirmar.json()) as HistoryItem;
}

export function adherencePercent(
  medications: Medication[],
  history: HistoryItem[],
) {
  const expected = medications.length * 7;
  if (expected === 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (history.filter((item) => item.status === "CONFIRMADO").length /
        expected) *
        100,
    ),
  );
}
export async function deleteMedication(id: number) {

  const response = await fetch(
    `${API_BASE_URL}/api/medicamentos/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Não foi possível excluir o medicamento.");
  }

  return true;
}