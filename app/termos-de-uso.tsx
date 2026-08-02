import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";

const commitments = [
  "Cadastrar apenas informações verdadeiras, completas e atualizadas.",
  "Revisar os nomes dos medicamentos, doses e horários antes de salvar qualquer informação.",
  "Seguir sempre as orientações do médico, farmacêutico ou outro profissional de saúde responsável pelo tratamento.",
  "Procurar atendimento médico ou farmacêutico em caso de urgência, reação adversa, dúvidas sobre o tratamento ou qualquer situação que exija avaliação profissional.",
];

export default function TermsOfUseScreen() {
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Legal"
        title="Termos de uso da plataforma"
        subtitle="Leia as condições para usar o PharmaLife com segurança."
      />

      <Card>
        <Text style={[styles.intro, darkMode && styles.textDark]}>
          O PharmaLife é uma ferramenta de organização de rotina voltada ao
          gerenciamento de medicamentos. A plataforma auxilia no registro de
          medicamentos, horários, lembretes e histórico, mas não substitui
          orientação médica, consulta com profissionais de saúde, prescrição
          médica ou atendimento de urgência e emergência.
        </Text>

        <View style={styles.commitments}>
          <Text style={[styles.section, darkMode && styles.textDark]}>
            Ao utilizar o PharmaLife, o usuário compromete-se a:
          </Text>
          {commitments.map((commitment) => (
            <View key={commitment} style={styles.commitmentRow}>
              <Text style={[styles.bullet, darkMode && styles.titleDark]}>•</Text>
              <Text style={[styles.commitmentText, darkMode && styles.textDark]}>
                {commitment}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.section, darkMode && styles.textDark]}>
          As notificações e lembretes disponibilizados pelo PharmaLife possuem
          caráter exclusivamente auxiliar e podem sofrer limitações em razão do
          navegador, dispositivo, conexão com a internet, nível de bateria,
          permissões do sistema operacional ou outros fatores técnicos. Dessa
          forma, o usuário permanece responsável pelo acompanhamento de seu
          tratamento.
        </Text>

        <Text style={[styles.section, darkMode && styles.textDark]}>
          Recomenda-se que menores de 16 anos e pessoas que necessitem de apoio
          utilizem a plataforma com o acompanhamento de um responsável legal ou
          cuidador.
        </Text>

        <Text style={[styles.section, darkMode && styles.textDark]}>
          Os dados informados pelo usuário são utilizados para o funcionamento da
          plataforma, incluindo a exibição da conta, da agenda de medicamentos,
          dos lembretes, dos recursos de acessibilidade e do histórico de
          utilização, conforme descrito na Política de Privacidade.
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
  commitments: {
    gap: 8,
  },
  commitmentRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    paddingLeft: 4,
  },
  bullet: {
    color: "#2F80ED",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
  },
  commitmentText: {
    color: "#4E7393",
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  textDark: {
    color: "#7FA8C8",
  },
  titleDark: {
    color: "#C8E0F4",
  },
});
