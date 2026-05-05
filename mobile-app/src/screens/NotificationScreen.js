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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotificationScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - trong thực tế sẽ lấy từ API
  const [allNotifications] = useState([
    {
      id: '1',
      type: 'savings',
      title: 'Mục tiêu tiết kiệm: Mua xe',
      content: 'Bạn đã tiết kiệm được 50% mục tiêu',
      timestamp: new Date('2026-05-05T14:30:00'),
      isRead: false,
    },
    {
      id: '2',
      type: 'recurring',
      title: 'Giao dịch định kỳ: Tiền thuê nhà',
      content: 'Thanh toán tiền thuê nhà hàng tháng sắp đến',
      timestamp: new Date('2026-05-05T10:15:00'),
      isRead: false,
    },
    {
      id: '3',
      type: 'reminder',
      title: 'Nhắc nhở: Kiểm tra ngân sách',
      content: 'Bạn đã chi tiêu 80% ngân sách cho tháng này',
      timestamp: new Date('2026-05-04T18:45:00'),
      isRead: true,
    },
    {
      id: '4',
      type: 'savings',
      title: 'Mục tiêu tiết kiệm: Du lịch',
      content: 'Bạn đã tiết kiệm được 30% mục tiêu',
      timestamp: new Date('2026-05-04T12:00:00'),
      isRead: true,
    },
    {
      id: '5',
      type: 'recurring',
      title: 'Giao dịch định kỳ: Thanh toán phí bảo hiểm',
      content: 'Phí bảo hiểm hàng tháng sắp đến',
      timestamp: new Date('2026-05-03T09:30:00'),
      isRead: true,
    },
    {
      id: '6',
      type: 'reminder',
      title: 'Nhắc nhở: Cập nhật danh mục chi tiêu',
      content: 'Hãy thêm các danh mục chi tiêu mới',
      timestamp: new Date('2026-05-02T15:20:00'),
      isRead: true,
    },
  ]);

  // Filter notifications
  const getFilteredNotifications = useCallback(() => {
    let filtered = allNotifications;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(n => n.type === selectedFilter);
    }

    // Filter by search text
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(lowerSearch) ||
        n.content.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [allNotifications, selectedFilter, searchText]);

  const filteredNotifications = getFilteredNotifications();

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'savings':
        return 'wallet';
      case 'recurring':
        return 'repeat';
      case 'reminder':
        return 'alarm';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'savings':
        return '#075c09';
      case 'recurring':
        return '#2196F3';
      case 'reminder':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.notificationItemUnread,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: getTypeColor(item.type) },
          ]}
        >
          <Ionicons name={getTypeIcon(item.type)} size={20} color="#fff" />
        </View>
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.notificationText} numberOfLines={2}>
          {item.content}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const filterButtons = [
    { id: 'all', label: 'Tất cả', icon: 'list' },
    { id: 'savings', label: 'Mục tiêu tiết kiệm', icon: 'wallet' },
    { id: 'recurring', label: 'Giao dịch định kỳ', icon: 'repeat' },
    { id: 'reminder', label: 'Nhắc nhở', icon: 'alarm' },
  ];

  return (
    <View style={styles.screenContainer}>
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Thông báo</Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setSidebarOpen(true)}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm thông báo..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={selectedFilter === filter.id ? '#fff' : '#075c09'}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.id &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        <View style={styles.contentContainer}>
          {filteredNotifications.length > 0 ? (
            <FlatList
              data={filteredNotifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
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

      {/* Footer */}
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
    padding: 16,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    maxHeight: 50,
    backgroundColor: '#FFF8F0',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
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
  filterButtonActive: {
    backgroundColor: '#075c09',
    borderColor: '#075c09',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#075c09',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  notificationsList: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
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
  notificationItemUnread: {
    backgroundColor: '#F0F8F0',
    borderLeftColor: '#075c09',
  },
  notificationIcon: {
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
