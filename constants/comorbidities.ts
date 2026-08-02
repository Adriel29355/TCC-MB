export const NO_COMORBIDITIES = "Nao possuo comorbidades";
export const OTHER_COMORBIDITY = "Outra";

export const COMORBIDITY_OPTIONS = [
  "Diabetes",
  "Hipertensao",
  "Asma",
  "Bronquite",
  "Rinite alergica",
  "Sinusite cronica",
  "DPOC",
  "Hipotireoidismo",
  "Hipertireoidismo",
  "Colesterol alto",
  "Triglicerides altos",
  "Doenca cardiaca",
  "Arritmia",
  "Insuficiencia cardiaca",
  "Doenca renal cronica",
  "Gastrite",
  "Refluxo gastroesofagico",
  "Doenca hepatica",
  "Artrite",
  "Artrose",
  "Osteoporose",
  "Fibromialgia",
  "Enxaqueca",
  "Epilepsia",
  "AVC previo",
  "Ansiedade",
  "Depressao",
  "TDAH",
  "Autismo",
  "Anemia",
  "Obesidade",
  "Apneia do sono",
  "Glaucoma",
  "Catarata",
  "Cancer em tratamento",
  "Doenca autoimune",
  "Lupus",
  "Psoriase",
  "HIV",
  "Alergias medicamentosas",
  OTHER_COMORBIDITY,
  NO_COMORBIDITIES,
] as const;

export function parseComorbidities(value?: string | null) {
  const values = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.includes(NO_COMORBIDITIES)) {
    return { selected: [NO_COMORBIDITIES], other: "" };
  }

  const knownOptions = new Set<string>(COMORBIDITY_OPTIONS);
  const selected = values.filter((item) => knownOptions.has(item));
  const customValues = values.filter((item) => !knownOptions.has(item));
  if (customValues.length) selected.push(OTHER_COMORBIDITY);

  return {
    selected: [...new Set(selected)],
    other: customValues.join(", "),
  };
}

export function formatComorbidities(selected: string[], other: string) {
  if (selected.includes(NO_COMORBIDITIES)) return NO_COMORBIDITIES;

  const knownValues = selected.filter(
    (item) => item !== OTHER_COMORBIDITY,
  );
  return [...knownValues, other.trim()].filter(Boolean).join(", ");
}
