export const FIELD_LIMITS = {
  personName: 80,
  email: 254,
  password: 72,
  birthDate: 10,
  healthCondition: 100,
  medicationName: 100,
  dosage: 60,
  medicationObservation: 50,
  observation: 300,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
const MEDICATION_NAME_PATTERN =
  /^[\p{L}\p{M}\p{N} .,'’()+/%+-]+$/u;
const DOSAGE_PATTERN = /^[\p{L}\p{M}\p{N} .,()+/%µμ+-]+$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const UNSAFE_STRUCTURAL_CHARACTER_PATTERN = /[<>{}\\]/;
const VERY_COMMON_PASSWORDS = new Set([
  "123456789012",
  "qwertyuiop12",
  "senha123456",
  "password1234",
]);

export function validateRequired(
  value: string,
  label: string,
  maximumLength: number,
) {
  const normalized = value.trim();
  if (!normalized) return `Informe ${label}.`;
  if (normalized.length > maximumLength) {
    return `${label} deve ter no maximo ${maximumLength} caracteres.`;
  }
  if (CONTROL_CHARACTER_PATTERN.test(normalized)) {
    return `${label} contem um caractere nao permitido.`;
  }
  return "";
}

export function validatePersonName(value: string) {
  const requiredError = validateRequired(
    value,
    "o nome",
    FIELD_LIMITS.personName,
  );
  if (requiredError) return requiredError;

  const normalized = value.trim();
  if (normalized.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  if (!PERSON_NAME_PATTERN.test(normalized)) {
    return "Use apenas letras, espacos, apostrofo, ponto ou hifen no nome.";
  }
  return "";
}

export function validateEmail(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Informe o e-mail.";
  if (normalized.length > FIELD_LIMITS.email) {
    return `O e-mail deve ter no maximo ${FIELD_LIMITS.email} caracteres.`;
  }
  if (!EMAIL_PATTERN.test(normalized)) return "Informe um e-mail valido.";
  return "";
}

export function validateLoginPassword(value: string) {
  if (!value) return "Informe a senha.";
  if (value.length > FIELD_LIMITS.password) {
    return `A senha deve ter no maximo ${FIELD_LIMITS.password} caracteres.`;
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return "A senha contem um caractere nao permitido.";
  }
  return "";
}

export function validateNewPassword(value: string) {
  if (!value) return "Informe a senha.";
  if (value.length < 12) return "A senha deve ter pelo menos 12 caracteres.";
  if (value.length > FIELD_LIMITS.password) {
    return `A senha deve ter no maximo ${FIELD_LIMITS.password} caracteres.`;
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return "A senha contem um caractere nao permitido.";
  }
  if (!/\p{L}/u.test(value) || !/\p{N}/u.test(value)) {
    return "Use pelo menos uma letra e um numero na senha.";
  }
  if (/(.)\1{5,}/u.test(value) || VERY_COMMON_PASSWORDS.has(value.toLowerCase())) {
    return "Essa senha e muito previsivel. Escolha outra.";
  }
  return "";
}

export function birthDateToIso(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function validateBirthDate(value: string) {
  if (!value.trim()) return "Informe a data de nascimento.";

  const isoDate = birthDateToIso(value);
  if (!isoDate) return "Informe uma data valida no formato DD/MM/AAAA.";

  const [year, month, day] = isoDate.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) return "A data de nascimento nao pode estar no futuro.";

  const oldestAllowedDate = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate(),
  );
  if (birthDate < oldestAllowedDate) {
    return "A data de nascimento deve corresponder a no maximo 120 anos.";
  }

  return "";
}

export function validateOptionalText(
  value: string,
  label: string,
  maximumLength: number,
) {
  const normalized = value.trim();
  if (!normalized) return "";
  if (normalized.length > maximumLength) {
    return `${label} deve ter no maximo ${maximumLength} caracteres.`;
  }
  if (CONTROL_CHARACTER_PATTERN.test(normalized)) {
    return `${label} contem um caractere nao permitido.`;
  }
  if (UNSAFE_STRUCTURAL_CHARACTER_PATTERN.test(normalized)) {
    return `${label} contem simbolos nao permitidos: < > { } ou barra invertida.`;
  }
  return "";
}

export function validateHealthCondition(value: string) {
  const optionalError = validateOptionalText(
    value,
    "A comorbidade",
    FIELD_LIMITS.healthCondition,
  );
  if (optionalError || !value.trim()) return optionalError;
  if (!MEDICATION_NAME_PATTERN.test(value.trim())) {
    return "Use letras, numeros e pontuacao comum na comorbidade.";
  }
  return "";
}

export function validateMedicationName(value: string) {
  const requiredError = validateRequired(
    value,
    "o nome do medicamento",
    FIELD_LIMITS.medicationName,
  );
  if (requiredError) return requiredError;
  if (UNSAFE_STRUCTURAL_CHARACTER_PATTERN.test(value)) {
    return "O nome contem simbolos nao permitidos: < > { } ou barra invertida.";
  }
  if (!MEDICATION_NAME_PATTERN.test(value.trim())) {
    return "Use letras, numeros e pontuacao comum no nome do medicamento.";
  }
  return "";
}

export function validateDosage(value: string) {
  const requiredError = validateRequired(
    value,
    "a dosagem",
    FIELD_LIMITS.dosage,
  );
  if (requiredError) return requiredError;
  if (UNSAFE_STRUCTURAL_CHARACTER_PATTERN.test(value)) {
    return "A dosagem contem simbolos nao permitidos: < > { } ou barra invertida.";
  }
  if (!/\p{N}/u.test(value)) {
    return "A dosagem deve conter um numero, por exemplo: 50 mg.";
  }
  if (!DOSAGE_PATTERN.test(value.trim())) {
    return "Use apenas numeros, unidades e pontuacao comum na dosagem.";
  }
  return "";
}

export function validateTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return "Use o formato HH:mm, por exemplo: 08:30.";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return "Informe um horario entre 00:00 e 23:59.";
  }
  return "";
}

export function hasValidationErrors(errors: Record<string, string>) {
  return Object.values(errors).some(Boolean);
}
