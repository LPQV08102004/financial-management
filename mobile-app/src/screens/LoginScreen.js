/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }

    try {
      setLoading(true);
      let result;
      if (mode === 'register') {
        result = await signUp(email.trim(), password, fullName.trim(), phoneNumber.trim());
      } else {
        result = await signIn(email.trim(), password);
      }

      if (!result?.success) {
        throw new Error(result?.message || (mode === 'register' ? 'Đăng ký thất bại' : 'Đăng nhập thất bại'));
      }

    } catch (e) {
      setError(e.message || (mode === 'register' ? 'Đăng ký thất bại' : 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setError('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Nhập tài khoản để vào ứng dụng' : 'Tạo tài khoản mới để sử dụng ứng dụng'}
      </Text>

      {mode === 'register' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mật khẩu"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Image
            source={showPassword ? require('../../assets/hide.png') : require('../../assets/view.png')}
            style={styles.eyeImage}
          />
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.loginButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={switchMode} disabled={loading}>
        <Text style={styles.switchText}>
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </Text>
      </TouchableOpacity>

  
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#075c09',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4f5b52',
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d9d4',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d9d4',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
  },
  eyeIcon: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeImage: {
    width: 24,
    height: 24,
  },
  loginButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#075c09',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#075c09',
    fontWeight: '600',
  },
});
