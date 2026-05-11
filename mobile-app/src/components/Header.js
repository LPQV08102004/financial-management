import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import HeaderIconButton from './HeaderIconButton';

export default function Header({
  title,
  rightIcon,
  onRightPress,
  onMenuPress,
  showMenu = true,
  style,
}) {
  return (
    <View style={[styles.header, style]}>
      {showMenu ? (
        <TouchableOpacity style={styles.headerMenu} onPress={onMenuPress}>
          <View style={styles.hamburgerLine}></View>
          <View style={styles.hamburgerLine}></View>
          <View style={styles.hamburgerLine}></View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.headerMenu} onPress={onMenuPress}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      )}

      <View style={styles.headerContent}>
        <View style={styles.headerLabelContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
      </View>

      {rightIcon ? (
        <HeaderIconButton icon={rightIcon} onPress={onRightPress} />
      ) : (
        <View style={styles.headerSpacer}></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: '#fff',
    marginVertical: 4,
    marginTop: 3,
    borderRadius: 2,
  },
  backArrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 30,
  },
  headerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
});
