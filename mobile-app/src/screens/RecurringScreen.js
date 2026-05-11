import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import Footer from '../components/Footer';
import SidebarDrawer from '../components/SidebarDrawer';
import { useFocusEffect } from '@react-navigation/native';
import { listTemplates, deleteTemplate, processAllDue, getUpcoming } from '../api/recurringApi';

const TABS = [
  { key: 'templates', label: 'Giao dịch định kỳ' },
  { key: 'upcoming',  label: 'Sắp tới (30 ngày)' },
];

const TYPE_COLOR = { income: '#075c09', expense: '#CC3300' };
const TYPE_LABEL = { income: 'Thu nhập', expense: 'Chi tiêu' };

const _fmtVND = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

const _fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  return `${d}/${m}/${y}`;
};

function TemplateCard({ item, onEdit, onDelete, onGenerate }) {
  const color = TYPE_COLOR[item.type] || '#333';
  return (
    <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: color }]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABEL[item.type]}</Text>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.cardAmount, { color }]}>{_fmtVND(item.amount)}</Text>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>🔁 {item.frequency_label}</Text>
        <Text style={styles.metaText}>📅 Tiếp theo: {_fmtDate(item.next_run_date)}</Text>
        {item.account_name && <Text style={styles.metaText}>🏦 {item.account_name}</Text>}
        {item.category_name && <Text style={styles.metaText}>📂 {item.category_name}</Text>}
        {item.end_date && <Text style={styles.metaText}>⏳ Hết hạn: {_fmtDate(item.end_date)}</Text>}
        {item.note ? <Text style={styles.noteText} numberOfLines={1}>💬 {item.note}</Text> : null}
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={onGenerate}>
        <Text style={styles.generateBtnText}>Tạo giao dịch ngay</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function UpcomingCard({ item }) {
  const color = TYPE_COLOR[item.type] || '#333';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: color }]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABEL[item.type]}</Text>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.cardAmount, { color, marginLeft: 'auto' }]}>{_fmtVND(item.amount)}</Text>
      </View>
      <View style={styles.cardMeta}>
        <Text style={[styles.metaText, { fontWeight: '700', color: '#333' }]}>
          📅 {_fmtDate(item.scheduled_date)}
        </Text>
        <Text style={styles.metaText}>🔁 {item.frequency_label}</Text>
        {item.account_name && <Text style={styles.metaText}>🏦 {item.account_name}</Text>}
        {item.category_name && <Text style={styles.metaText}>📂 {item.category_name}</Text>}
      </View>
    </View>
  );
}

export default function RecurringScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {

      processAllDue().catch(() => {});
      const [tmpls, upcomingData] = await Promise.all([
        listTemplates(),
        getUpcoming(30),
      ]);
      setTemplates(tmpls);
      setUpcoming(upcomingData);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleDelete = (item) => {
    Alert.alert(
      'Dừng giao dịch định kỳ',
      `Bạn có chắc muốn dừng "${item.name}"? Giao dịch đã tạo sẽ không bị xóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Dừng', style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate(item.id);
              fetchData(true);
            } catch (e) {
              Alert.alert('Lỗi', e.message);
            }
          },
        },
      ],
    );
  };

  const handleGenerate = async (item) => {
    try {
      const { generateDue } = require('../api/recurringApi');
      const result = await generateDue(item.id);
      Alert.alert('Thành công', result.message);
      fetchData(true);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const renderTemplates = () => (
    <FlatList
      data={templates}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={templates.length === 0 ? [styles.emptyContainer, styles.flatListPadding] : [styles.listContent, styles.flatListPadding]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(true); }} tintColor="#075c09" />
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🔁</Text>
          <Text style={styles.emptyText}>Chưa có giao dịch định kỳ nào{'\n'}Nhấn + để tạo mới</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TemplateCard
          item={item}
          onEdit={() => navigation.navigate('AddRecurring', { template: item })}
          onDelete={() => handleDelete(item)}
          onGenerate={() => handleGenerate(item)}
        />
      )}
    />
  );

  const renderUpcoming = () => {
    if (!upcoming) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#075c09" />;
    const { items, total_expense, total_income } = upcoming;
    return (
      <FlatList
        data={items}
        keyExtractor={(item, idx) => `${item.template_id}-${idx}`}
        contentContainerStyle={items.length === 0 ? [styles.emptyContainer, styles.flatListPadding] : [styles.listContent, styles.flatListPadding]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(true); }} tintColor="#075c09" />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryChip, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.summaryChipLabel}>Thu dự kiến</Text>
                <Text style={[styles.summaryChipAmount, { color: '#075c09' }]}>{_fmtVND(total_income)}</Text>
              </View>
              <View style={[styles.summaryChip, { backgroundColor: '#fff3f3' }]}>
                <Text style={styles.summaryChipLabel}>Chi dự kiến</Text>
                <Text style={[styles.summaryChipAmount, { color: '#CC3300' }]}>{_fmtVND(total_expense)}</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Không có giao dịch nào trong 30 ngày tới</Text>
          </View>
        }
        renderItem={({ item }) => <UpcomingCard item={item} />}
      />
    );
  };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giao dịch định kỳ</Text>
        {activeTab === 'templates' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddRecurring', { template: null })}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'upcoming' && <View style={{ width: 36 }} />}
      </View>

      {}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.key === 'templates' && templates.length > 0 ? ` (${templates.length})` : ''}
              {tab.key === 'upcoming' && upcoming?.items?.length > 0 ? ` (${upcoming.items.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#075c09" />
      ) : (
        activeTab === 'templates' ? renderTemplates() : renderUpcoming()
      )}
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#075c09',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#075c09' },
  tabText: { fontSize: 12, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#075c09', fontWeight: '700' },

  listContent: { padding: 12 },
  flatListPadding: { paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryChip: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  summaryChipLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  summaryChipAmount: { fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  typeBadge: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#333' },
  deleteIcon: { fontSize: 16 },
  cardAmount: { fontSize: 18, fontWeight: '800', marginBottom: 8 },

  cardMeta: { gap: 3, marginBottom: 10 },
  metaText: { fontSize: 12, color: '#666' },
  noteText: { fontSize: 12, color: '#888', fontStyle: 'italic' },

  generateBtn: {
    backgroundColor: '#f0f8f0',
    borderWidth: 1,
    borderColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  generateBtnText: { color: '#075c09', fontSize: 13, fontWeight: '700' },
});
