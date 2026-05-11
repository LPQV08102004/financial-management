import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [sdt, setSdt] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(0\d{9,10}|\+84\d{9,10})$/;
    return phoneRegex.test(phone);
  };

  const handleSignup = async () => {

    if (!fullname || !email || !sdt || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ. Vui lòng nhập đúng định dạng email (vd: abc@example.com)');
      return;
    }

    if (!validatePhone(sdt)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Vui lòng nhập: 0xxxxxxxxx hoặc +84xxxxxxxxx');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }

    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      Alert.alert('Lỗi', 'Mật khẩu phải từ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, fullname, sdt);
    setLoading(false);

    if (result.success) {
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } else {
      Alert.alert('Đăng ký thất bại', result.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appTitle}>Tạo tài khoản</Text>
          <Text style={styles.appSubtitle}>Đăng ký để quản lý tài chính</Text>
        </View>

        {}
        <View style={styles.formSection}>
          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên đầy đủ"
              placeholderTextColor="#999"
              value={fullname}
              onChangeText={setFullname}
              editable={!loading}
            />
          </View>

          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              value={sdt}
              onChangeText={setSdt}
              editable={!loading}
              keyboardType="phone-pad"
            />
          </View>

          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
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
          </View>

          {}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Image
                  source={showConfirmPassword ? require('../../assets/hide.png') : require('../../assets/view.png')}
                  style={styles.eyeImage}
                />
              </TouchableOpacity>
            </View>
          </View>

          {}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Đăng nhập tại đây</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerSection: {
    marginVertical: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backArrow: {
    fontSize: 24,
    color: '#075c09',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#075c09',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    marginVertical: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#075c09',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeImage: {
    width: 24,
    height: 24,
  },
  signupButton: {
    backgroundColor: '#075c09',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
  },
  loginLink: {
    color: '#075c09',
    fontSize: 13,
    fontWeight: '600',
  },
});
