import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, FlatList, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';
import { listReminders, updateReminder, deleteReminder } from '../api/notificationApi';

export default function Notification({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listReminders();
      setReminders(data);
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const toggleReminder = async (item) => {
    try {
      const updated = await updateReminder(item.id, { is_enabled: !item.is_enabled });
      setReminders(prev => prev.map(r => r.id === item.id ? updated : r));
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Xóa lời nhắc', `Bạn có chắc muốn xóa "${item.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReminder(item.id);
            setReminders(prev => prev.filter(r => r.id !== item.id));
          } catch (err) {
            Alert.alert('Lỗi', err.message);
          }
        },
      },
    ]);
  };

  const renderReminderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reminderItem}
      onPress={() => navigation.navigate('EditNotification', { reminder: item })}
      activeOpacity={0.7}
    >
      <View style={styles.reminderContent}>
        <View style={styles.reminderTextContainer}>
          <Text style={[styles.reminderTitle, !item.is_enabled && styles.reminderTitleDisabled]}>
            {item.name}
          </Text>
          {item.reminder_time && (
            <Text style={styles.reminderSub}>{item.reminder_time}</Text>
          )}
        </View>
      </View>
      <View style={styles.reminderActions}>
        <Switch
          style={styles.toggle}
          value={item.is_enabled}
          onValueChange={() => toggleReminder(item)}
          trackColor={{ false: '#ddd', true: '#075c09' }}
          thumbColor={item.is_enabled ? '#fff' : '#999'}
        />
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Nhắc nhở</Text>
          </View>
          <HeaderIconButton icon="+" onPress={() => navigation.navigate('AddNotification')} />
        </View>

        <View style={styles.contentWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color="#075c09" style={{ marginTop: 40 }} />
          ) : reminders.length > 0 ? (
            <FlatList
              data={reminders}
              renderItem={renderReminderItem}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              style={styles.reminderList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có lời nhắc nào</Text>
              <Text style={styles.emptySubText}>Nhấn + để thêm lời nhắc mới</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#FFF8F0' },
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  scrollContent: { paddingBottom: 40 },
  header: {
    backgroundColor: '#075c09',
    padding: 20,
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  hamburgerLine: { width: 24, height: 3, backgroundColor: '#fff', marginVertical: 4, marginTop: 3, borderRadius: 2 },
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 30, justifyContent: 'center' },
  headerText: { color: '#fff', fontSize: 20 },
  contentWrapper: { padding: 15 },
  reminderList: { marginTop: 0 },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reminderContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  reminderTextContainer: { flex: 1 },
  reminderTitle: { fontSize: 16, fontWeight: '600', color: '#075c09' },
  reminderTitleDisabled: { color: '#999', textDecorationLine: 'line-through' },
  reminderSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  reminderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: { marginHorizontal: 0 },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: { color: '#e74c3c', fontSize: 20, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#999', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#bbb', marginTop: 6 },
});
