import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Footer component để tạo khoảng trống ở dưới màn hình
 * Tránh va chạm với nút điều khiển của điện thoại (home button, gesture bar, etc.)
 */
export default function Footer({ height = 80, style }) {
  return (
    <View style={[styles.footer, { height }, style]} />
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#075c09',
  },
});
