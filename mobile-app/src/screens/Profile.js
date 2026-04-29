/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function Profile({ navigation }) {
  const { refreshProfile, signOut } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await refreshProfile();
      if (!result.success) {
        throw new Error(result.message);
      }
      setUser(result.user);
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const performLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    try {
      const result = await signOut();
      if (!result.success) {
        Alert.alert('Lỗi', result.message || 'Đăng xuất thất bại');
      }
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#075c09" />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Hồ sơ cá nhân</Text>
          </View>
          <View style={styles.headerSpacer}></View>
        </View>

        {/* Content */}
        <View style={styles.contentWrapper}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => console.log('Change avatar')}
            >
              <Text style={styles.editAvatarIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.infoSection}>
            {/* Name */}
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Tên</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoValue}>{user?.full_name || 'N/A'}</Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Địa chỉ email</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoValue}>{user?.phone_number || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>

            {/* Change Password Button */}
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Text style={styles.changePasswordButtonText}>Đổi mật khẩu</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              <Text style={styles.logoutButtonText}>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Footer />

      <Modal
        transparent
        animationType="fade"
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.modalMessage}>Bạn có chắc chắn muốn đăng xuất?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, loggingOut && styles.modalButtonDisabled]}
                onPress={() => {
                  setShowLogoutModal(false);
                  InteractionManager.runAfterInteractions(() => {
                    void performLogout();
                  });
                }}
                disabled={loggingOut}
              >
                <Text style={styles.confirmButtonText}>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#075c09',
    padding: 20,
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMenu: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backArrow: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 30,
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 50,
  },
  contentWrapper: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
    position: 'relative',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(7, 92, 9, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#075c09',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '25%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#075c09',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF8F0',
  },
  editAvatarIcon: {
    fontSize: 20,
  },
  avatarText: {
    fontSize: 60,
  },
  infoSection: {
    marginTop: 20,
  },
  infoGroup: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#075c09',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  changePasswordButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#075c09',
  },
  changePasswordButtonText: {
    color: '#075c09',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonDisabled: {
    opacity: 0.75,
  },
});
