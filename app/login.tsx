import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';
import { loginUser } from '@/lib/pharmalife';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await loginUser(email || 'usuario@pharmalife.com', senha || '123456', admin);
    setLoading(false);
    router.replace('/');
  }

  return (
    <PharmaScreen>
      <SectionHeader eyebrow="Acesso" title="Entrar" subtitle="Use sua conta PharmaLife para abrir sua agenda de medicamentos." />

      <Card>
        <TextInput
          style={pharmaStyles.input}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={pharmaStyles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Entrar como administrador</Text>
          <Switch value={admin} onValueChange={setAdmin} />
        </View>

        <Pressable style={pharmaStyles.primaryButton} onPress={handleLogin} disabled={loading}>
          <Text style={pharmaStyles.primaryButtonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/cadastro')}>
          <Text style={styles.link}>Criar uma conta</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchText: {
    color: '#14324A',
    fontWeight: '700',
  },
  link: {
    color: '#2F80ED',
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'none',
  },
});
