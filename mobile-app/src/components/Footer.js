import React from 'react';
import { View, StyleSheet } from 'react-native';

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
