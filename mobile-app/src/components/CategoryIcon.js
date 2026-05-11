import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const IONICONS_NAME = /^[a-z][a-z0-9-]*$/;

export default function CategoryIcon({ icon, size = 28, color = '#fff' }) {
  if (!icon) {
    return <Ionicons name="help-circle" size={size} color={color} />;
  }
  if (IONICONS_NAME.test(icon)) {
    return <Ionicons name={icon} size={size} color={color} />;
  }
  return (
    <Text style={{ fontSize: size * 0.85, lineHeight: size, textAlign: 'center' }}>
      {icon}
    </Text>
  );
}
