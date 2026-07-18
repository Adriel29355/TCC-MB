import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";

const sections = [
  {
    title: "1. Finalidade do aplicativo",
    text: "O PharmaLife ajuda a organizar medicamentos, horários, lembretes e confirmações de uso. O aplicativo não substitui orientação, diagnóstico, prescrição ou atendimento de profissionais de saúde.",
  },
  {
    title: "2. Cadastro e responsabilidade",
    text: "Você deve fornecer informações verdadeiras e manter sua senha protegida. Revise nomes, doses e horários cadastrados e siga sempre a prescrição recebida do profissional responsável.",
  },
  {
    title: "3. Lembretes e disponibilidade",
    text: "Notificações podem sofrer atrasos ou deixar de ser exibidas por falta de internet, bateria, permissões ou configurações do aparelho. Não dependa exclusivamente do aplicativo para usar medicamentos essenciais.",
  },
  {
    title: "4. Dados pessoais",
    text: "Usamos os dados informados para criar sua conta e oferecer as funções do PharmaLife. Isso pode incluir nome, e-mail, data de nascimento, comorbidades e informações sobre medicamentos. Esses dados devem ser tratados apenas para operação e segurança do serviço, conforme a legislação aplicável.",
  },
  {
    title: "5. Uso adequado",
    text: "Não use o aplicativo para práticas ilegais, tentar acessar contas de terceiros, interferir no serviço ou inserir conteúdo malicioso. O acesso pode ser limitado quando houver risco a usuários ou ao sistema.",
  },
  {
    title: "6. Exclusão da conta",
    text: "Você pode excluir sua conta nas configurações. A exclusão remove permanentemente os dados vinculados, inclusive agendas, medicamentos e histórico, ressalvadas obrigações legais de conservação.",
  },
  {
    title: "7. Alterações destes termos",
    text: "Estes termos podem ser atualizados para refletir mudanças no aplicativo ou em requisitos legais. Quando uma alteração exigir novo consentimento, ela será apresentada antes da continuidade do uso.",
  },
];

export default function TermsOfUseScreen() {
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Legal"
        title="Termos de Uso"
        subtitle="Última atualização: 18 de julho de 2026."
      />

      <Card>
        <Text style={[styles.intro, darkMode && styles.textDark]}>
          Ao criar uma conta, você declara que leu e concorda com as condições abaixo.
        </Text>

        {sections.map((section) => (
          <Text
            key={section.title}
            style={[styles.section, darkMode && styles.textDark]}
          >
            <Text style={[styles.title, darkMode && styles.titleDark]}>
              {section.title}{"\n"}
            </Text>
            {section.text}
          </Text>
        ))}

        <Text style={[styles.note, darkMode && styles.textDark]}>
          Em caso de urgência ou dúvida sobre um tratamento, procure um profissional de saúde ou um serviço de emergência.
        </Text>

        <Pressable style={ps.primaryButton} onPress={() => router.back()}>
          <Text style={ps.primaryButtonText}>Voltar ao cadastro</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: "#4E7393",
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    color: "#4E7393",
    fontSize: 14,
    lineHeight: 21,
  },
  title: {
    color: "#14324A",
    fontSize: 16,
    fontWeight: "800",
  },
  note: {
    color: "#4E7393",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 19,
  },
  textDark: {
    color: "#7FA8C8",
  },
  titleDark: {
    color: "#C8E0F4",
  },
});
