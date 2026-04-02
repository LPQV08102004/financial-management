/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function Profile({ navigation }) {
  const { refreshProfile, signOut } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', onPress: () => {}, style: 'cancel' },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
          style: 'destructive',
        },
      ]
    );
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
      <ScrollView style={styles.container} scrollEnabled={true}>
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

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
