import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';
import { loginUser } from '@/lib/pharmalife';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin() {
    setMessage('');

    if (!email.trim() || !senha.trim()) {
      setMessage('Informe seu e-mail e sua senha para entrar.');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, senha);
      router.replace('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Acesso"
        title="Entrar"
        subtitle="Use sua conta PharmaLife para abrir sua agenda pessoal de medicamentos."
      />

      <Card>
        <View style={styles.brandBox}>
          <Text style={styles.brand}>PharmaLife</Text>
          <Text style={styles.brandText}>Seus horarios, remedios e historico protegidos em um so lugar.</Text>
        </View>

        <TextInput
          style={pharmaStyles.input}
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Digite sua senha"
          secureTextEntry
          autoComplete="password"
          value={senha}
          onChangeText={setSenha}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

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
  brandBox: {
    borderWidth: 1,
    borderColor: '#D8ECFF',
    borderRadius: 8,
    backgroundColor: '#EAF6FF',
    gap: 6,
    padding: 14,
  },
  brand: {
    color: '#2F80ED',
    fontSize: 22,
    fontWeight: '900',
  },
  brandText: {
    color: '#4E7393',
    fontSize: 14,
    lineHeight: 20,
  },
  message: {
    color: '#C2410C',
    fontWeight: '700',
  },
  link: {
    color: '#2F80ED',
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'none',
  },
});
