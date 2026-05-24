import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

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

  async function handleRegister() {
    if (senha !== confirmarSenha) {
      setMessage('As senhas precisam ser iguais.');
      return;
    }

    await registerUser({
      nome: nome || 'Usuario',
      email: email || 'usuario@pharmalife.com',
      senha: senha || '123456',
      idade: Number(idade) || null,
      comorbidade: comorbidade || null,
    });
    router.replace('/login');
  }

  return (
    <PharmaScreen>
      <SectionHeader eyebrow="Cadastro" title="Criar conta" subtitle="Informe seus dados para organizar seus medicamentos." />

      <Card>
        <TextInput style={pharmaStyles.input} placeholder="Nome de usuario" value={nome} onChangeText={setNome} />
        <TextInput style={pharmaStyles.input} placeholder="Idade" keyboardType="number-pad" value={idade} onChangeText={setIdade} />
        <TextInput style={pharmaStyles.input} placeholder="Comorbidade (opcional)" value={comorbidade} onChangeText={setComorbidade} />
        <TextInput
          style={pharmaStyles.input}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={pharmaStyles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={pharmaStyles.primaryButton} onPress={handleRegister}>
          <Text style={pharmaStyles.primaryButtonText}>Cadastrar</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.link}>Ja tenho conta</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
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
