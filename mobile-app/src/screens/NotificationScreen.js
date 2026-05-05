import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import Footer from '../components/Footer';
import {
  generateNotifications,
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from '../api/notificationApi';

export default function NotificationScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async (filter = selectedFilter) => {
    try {
      setLoading(true);
      await generateNotifications();
      const res = await listNotifications({
        displayType: filter !== 'all' ? filter : undefined,
      });
      setNotifications(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Lỗi lấy thông báo:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(selectedFilter);
    }, [selectedFilter])
  );

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    loadNotifications(filter);
  };

  const handleMarkRead = async (item) => {
    if (item.is_read) return;
    try {
      await markRead(item.id);
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNotification(item.id);
            setNotifications(prev => prev.filter(n => n.id !== item.id));
            if (!item.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
          } catch (err) {
            Alert.alert('Lỗi', err.message);
          }
        },
      },
    ]);
  };

  const filteredNotifications = notifications.filter(n => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTypeIcon = (displayType) => {
    switch (displayType) {
      case 'savings': return 'wallet';
      case 'recurring': return 'repeat';
      case 'reminder': return 'time';
      default: return 'notifications';
    }
  };

  const getTypeColor = (displayType) => {
    switch (displayType) {
      case 'savings': return '#075c09';
      case 'recurring': return '#2196F3';
      case 'reminder': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.notificationItemUnread]}
      activeOpacity={0.7}
      onPress={() => handleMarkRead(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.notificationIcon}>
        <View style={[styles.iconCircle, { backgroundColor: getTypeColor(item.display_type) }]}>
          <Ionicons name={getTypeIcon(item.display_type)} size={20} color="#fff" />
        </View>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={styles.notificationText} numberOfLines={2}>{item.content}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const filterButtons = [
    { id: 'all', label: 'Tất cả', icon: 'list' },
    { id: 'savings', label: 'Tiết kiệm', icon: 'wallet' },
    { id: 'recurring', label: 'Định kỳ', icon: 'repeat' },
    { id: 'reminder', label: 'Nhắc nhở', icon: 'time' },
  ];

  return (
    <View style={styles.screenContainer}>
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Thông báo</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.readAllButton}>
                <Text style={styles.readAllText}>Đọc tất cả</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarOpen(true)}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm thông báo..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterButtons.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterButton, selectedFilter === f.id && styles.filterButtonActive]}
              onPress={() => handleFilterChange(f.id)}
            >
              <Ionicons name={f.icon} size={16} color={selectedFilter === f.id ? '#fff' : '#075c09'} />
              <Text style={[styles.filterButtonText, selectedFilter === f.id && styles.filterButtonTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#075c09" />
            </View>
          ) : filteredNotifications.length > 0 ? (
            <FlatList
              data={filteredNotifications}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.notificationsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-none" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có thông báo nào</Text>
              <Text style={styles.emptySubText}>
                {searchText.trim()
                  ? 'Không tìm thấy thông báo phù hợp'
                  : 'Bạn sẽ nhận được thông báo từ các hoạt động tài chính'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#FFF8F0' },
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    backgroundColor: '#075c09',
    padding: 16,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerContent: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  badgeContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readAllButton: { paddingVertical: 4, paddingHorizontal: 8 },
  readAllText: { color: '#fff', fontSize: 12, textDecorationLine: 'underline' },
  menuButton: { padding: 8, marginRight: -8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1F2937' },
  clearButton: { padding: 4 },
  filterContainer: { maxHeight: 50, backgroundColor: '#FFF8F0' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#075c09',
    backgroundColor: '#fff',
  },
  filterButtonActive: { backgroundColor: '#075c09', borderColor: '#075c09' },
  filterButtonText: { fontSize: 12, color: '#075c09', fontWeight: '500' },
  filterButtonTextActive: { color: '#fff' },
  contentContainer: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  notificationsList: { paddingVertical: 8, paddingBottom: 20 },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  notificationItemUnread: { backgroundColor: '#F0F8F0', borderLeftColor: '#075c09' },
  notificationIcon: { marginRight: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notificationContent: { flex: 1, marginRight: 8 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notificationTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },
  notificationTime: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  notificationText: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
});
