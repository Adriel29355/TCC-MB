import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';
import { getStoredUser, setStoredUser } from '@/lib/pharmalife';

export default function ConfiguracoesScreen() {
  const user = getStoredUser();
  const [nome, setNome] = useState(user.nome);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [largeText, setLargeText] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [message, setMessage] = useState('');

  function handleSave() {
    setStoredUser({ ...user, nome, senha: novaSenha || user.senha });
    setMessage('Perfil atualizado.');
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Configuracoes"
        title="Perfil e preferencias"
        subtitle="Edite dados da conta e ajuste recursos de acessibilidade."
      />

      <Card>
        <Text style={pharmaStyles.cardTitle}>Editar nome e senha</Text>
        <TextInput style={pharmaStyles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
        <TextInput style={pharmaStyles.input} placeholder="Senha atual" secureTextEntry value={senhaAtual} onChangeText={setSenhaAtual} />
        <TextInput style={pharmaStyles.input} placeholder="Nova senha" secureTextEntry value={novaSenha} onChangeText={setNovaSenha} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={pharmaStyles.primaryButton} onPress={handleSave}>
          <Text style={pharmaStyles.primaryButtonText}>Atualizar perfil</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Acessibilidade</Text>
        <View style={styles.optionRow}>
          <View>
            <Text style={styles.optionTitle}>Letras grandes</Text>
            <Text style={pharmaStyles.small}>Interface mais facil de ler.</Text>
          </View>
          <Switch value={largeText} onValueChange={setLargeText} />
        </View>
        <View style={styles.optionRow}>
          <View>
            <Text style={styles.optionTitle}>Lembretes ativos</Text>
            <Text style={pharmaStyles.small}>Avisos para horarios importantes.</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
      </Card>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Conta</Text>
        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.link}>Fazer login novamente</Text>
        </Pressable>
        <Pressable style={pharmaStyles.secondaryButton} onPress={() => router.replace('/cadastro')}>
          <Text style={pharmaStyles.secondaryButtonText}>Criar outra conta</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  message: {
    color: '#12805C',
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionTitle: {
    color: '#14324A',
    fontWeight: '800',
  },
  link: {
    color: '#2F80ED',
    fontWeight: '800',
    textDecorationLine: 'none',
  },
});
