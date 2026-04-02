import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SidebarDrawer({ isOpen, onClose, navigation }) {
  const { state } = useAuth();
  const user = state.user;
  const sidebarAnimation = useRef(new Animated.Value(-240)).current;

  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: isOpen ? 0 : -240,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <TouchableOpacity 
          style={styles.sidebarOverlay} 
          onPress={onClose}
          activeOpacity={1}
          pointerEvents="auto"
        />
      )}

      {/* Sidebar */}
      {isOpen && (
        <Animated.View 
          style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}
          pointerEvents="auto"
        >
          {/* User Profile Section */}
          <TouchableOpacity 
            style={styles.userProfileContainer}
            onPress={() => {
              console.log('Profile click detected'); // Debug log
              navigation.navigate('Profile');
              onClose();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.userAvatarCircle} pointerEvents="none">
              <Text style={styles.userAvatarText}>👤</Text>
            </View>
            <View style={styles.userInfoContainer} pointerEvents="none">
              <Text style={styles.userName}>{user?.fullname || 'Người dùng'}</Text>
              <Text style={styles.userBalance}>Số dư: 5,000,000 đ</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate('Home');
              onClose();
            }}
          >
            <Text style={styles.sidebarItemText}>🏠 Trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate('Chart');
              onClose();
            }}
          >
            <Text style={styles.sidebarItemText}>📊 Biểu đồ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem}>
            <Text style={styles.sidebarItemText}>📑 Danh mục</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarItem}
            onPress={() => {
              navigation.navigate('Notification');
              onClose();
            }}
          >
            <Text style={styles.sidebarItemText}>🔔 Nhắc nhở</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sidebarOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    zIndex: 1 
  },
  sidebar: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: '75%', 
    backgroundColor: '#216b38', 
    paddingTop: 30, 
    paddingHorizontal: 20, 
    zIndex: 2, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 2, height: 0 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5 
  },
  userProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  userAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 32,
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userBalance: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  sidebarItem: { 
    paddingVertical: 16, 
    paddingHorizontal: 12, 
  },
  sidebarItemText: { 
    fontSize: 18, 
    color: '#fff', 
    fontWeight: '500' 
  },
});
