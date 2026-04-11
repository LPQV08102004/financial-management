import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Switch } from 'react-native';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import HeaderIconButton from '../components/HeaderIconButton';
import Footer from '../components/Footer';

export default function Notification({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dữ liệu mẫu lời nhắc custom
  const [reminders, setReminders] = useState([
    {
      id: '1',
      title: 'Đóng tiền quỹ',
      enabled: true,
    },
    {
      id: '2',
      title: 'Lời nhắc đóng tiền điện',
      enabled: true,
    },
  ]);

  const toggleReminder = (id) => {
    setReminders(reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
    ));
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
  };

  const renderReminderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reminderItem}
      onPress={() => navigation.navigate('EditNotification', { reminder: item })}
      activeOpacity={0.7}
    >
      <View style={styles.reminderContent}>
        <View style={styles.reminderTextContainer}>
          <Text style={[styles.reminderTitle, !item.enabled && styles.reminderTitleDisabled]}>
            {item.title}
          </Text>
        </View>
      </View>
      <View style={styles.reminderActions}>
        <Switch
          style={styles.toggle}
          value={item.enabled}
          onValueChange={() => toggleReminder(item.id)}
          trackColor={{ false: '#ddd', true: '#075c09' }}
          thumbColor={item.enabled ? '#fff' : '#999'}
        />
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteReminder(item.id)}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <SidebarDrawer 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        navigation={navigation}
      />

      <ScrollView style={styles.container} scrollEnabled={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Nhắc nhở</Text>
          </View>
          <HeaderIconButton 
            icon="+" 
            onPress={() => navigation.navigate('AddNotification')}
          />
        </View>

        {/* Content */}
        <View style={styles.contentWrapper}>
          {reminders.length > 0 ? (
            <FlatList
              data={reminders}
              renderItem={renderReminderItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              style={styles.reminderList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có lời nhắc nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Footer />
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
    justifyContent: 'space-between' 
  },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  hamburgerLine: { width: 24, height: 3, backgroundColor: '#fff', marginVertical: 4, marginTop: 3, borderRadius: 2 },
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 30, justifyContent: 'center' },
  headerText: { color: '#fff', fontSize: 20 },
  contentWrapper: {
    padding: 15,
  },
  notificationList: {
    marginTop: 0,
  },
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
  reminderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075c09',
  },
  reminderTitleDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggle: {
    marginHorizontal: 0,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
