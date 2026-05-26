export const API_BASE_URL =
  typeof window !== "undefined" ? "http://localhost:8080" : "http://10.0.2.2:8080";

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

export function getStoredMedications(): Medication[] {
  const raw = storage.get("pharmalife:medications");
  return raw ? JSON.parse(raw) : sampleMedications;
}

export function setStoredMedications(medications: Medication[]) {
  storage.set("pharmalife:medications", JSON.stringify(medications));
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
    throw new Error(await parseApiError(response, "Email ou senha incorretos."));
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
    throw new Error(await parseApiError(response, "Nao foi possivel criar a conta."));
  }

  return (await response.json()) as User;
}

export function addMedication(
  input: Omit<Medication, "id" | "statusMedicamento" | "agenda"> & {
    horario: string;
  },
) {
  const medications = getStoredMedications();
  const newMedication: Medication = {
    id: Date.now(),
    nome: input.nome,
    descricao: input.descricao,
    tipo: input.tipo,
    complemento: input.complemento,
    statusMedicamento: "proximo",
    agenda: { id: 1, nome: "Agenda Principal", horario: input.horario },
  };

  setStoredMedications([newMedication, ...medications]);
  return newMedication;
}

export function markMedicationAsTaken(medication: Medication) {
  const history = getStoredHistory();
  const entry: HistoryItem = {
    id: Date.now(),
    nome: medication.nome,
    dosagem: medication.descricao,
    observacoes: medication.complemento,
    horario:
      medication.agenda?.horario ?? new Date().toTimeString().slice(0, 5),
    status: "CONFIRMADO",
    dataConfirmacao: new Date().toISOString(),
  };

  setStoredHistory([entry, ...history]);
  return entry;
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
