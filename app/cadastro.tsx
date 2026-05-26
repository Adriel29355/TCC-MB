import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';
import { registerUser } from '@/lib/pharmalife';

export default function CadastroScreen() {
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [comorbidade, setComorbidade] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setMessage('');
    setSuccess(false);

    if (!nome.trim() || !idade.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      setMessage('Preencha nome, idade, e-mail, senha e confirmacao.');
      return;
    }

    if (senha !== confirmarSenha) {
      setMessage('As senhas precisam ser iguais.');
      return;
    }

    const parsedAge = Number(idade);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setMessage('Informe uma idade valida entre 1 e 120 anos.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        nome,
        email,
        senha,
        idade: parsedAge,
        comorbidade: comorbidade || null,
      });
      setSuccess(true);
      setMessage('Conta criada com sucesso. Faca login para continuar.');
      setTimeout(() => router.replace('/login'), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Cadastro"
        title="Criar conta"
        subtitle="Informe seus dados para organizar lembretes e historico dos seus medicamentos."
      />

      <Card>
        <View style={styles.brandBox}>
          <Text style={styles.brand}>Agenda pessoal</Text>
          <Text style={styles.brandText}>Seu cadastro cria a base para acompanhar horarios, doses e confirmacoes.</Text>
        </View>

        <TextInput style={pharmaStyles.input} placeholder="Nome de usuario" autoComplete="name" value={nome} onChangeText={setNome} />
        <TextInput style={pharmaStyles.input} placeholder="Idade" keyboardType="number-pad" value={idade} onChangeText={setIdade} />
        <TextInput style={pharmaStyles.input} placeholder="Comorbidade (opcional)" value={comorbidade} onChangeText={setComorbidade} />
        <TextInput
          style={pharmaStyles.input}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={pharmaStyles.input} placeholder="Senha" secureTextEntry autoComplete="password-new" value={senha} onChangeText={setSenha} />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />

        {message ? <Text style={[styles.message, success && styles.success]}>{message}</Text> : null}

        <Pressable style={pharmaStyles.primaryButton} onPress={handleRegister} disabled={loading}>
          <Text style={pharmaStyles.primaryButtonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.link}>Ja tenho conta</Text>
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
  success: {
    color: '#12805C',
  },
  link: {
    color: '#2F80ED',
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'none',
  },
});
