import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listGoals, deleteGoal } from '../api/savingsGoalsApi';

const STATUS_TABS = [
  { key: 'in_progress', label: 'Đang thực hiện' },
  { key: 'completed',   label: 'Hoàn thành' },
  { key: 'overdue',     label: 'Quá hạn' },
];

const STATUS_COLOR = {
  in_progress: '#075c09',
  completed:   '#0066CC',
  overdue:     '#CC3300',
};

const _fmtVND = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

const _fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

function ProgressBar({ pct, color }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function GoalCard({ goal, onPress, onDelete }) {
  const color = STATUS_COLOR[goal.status] || '#075c09';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{goal.name}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      <ProgressBar pct={goal.progress_pct} color={color} />

      <View style={styles.cardRow}>
        <Text style={styles.cardSaved}>{_fmtVND(goal.saved_amount)}</Text>
        <Text style={styles.cardTarget}> / {_fmtVND(goal.target_amount)}</Text>
        <Text style={[styles.cardPct, { color }]}>{goal.progress_pct.toFixed(0)}%</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardInfo}>
          Hạn: {_fmtDate(goal.deadline)}
          {goal.months_remaining > 0 ? `  ·  còn ${goal.months_remaining} tháng` : ''}
        </Text>
        {goal.status === 'in_progress' && goal.amount_remaining > 0 && (
          <Text style={styles.cardMissing}>
            Còn thiếu {_fmtVND(goal.amount_remaining)}
          </Text>
        )}
        {goal.status === 'in_progress' && goal.monthly_needed > 0 && (
          <Text style={styles.cardMonthly}>
            Cần để dành {_fmtVND(goal.monthly_needed)}/tháng
          </Text>
        )}
        {goal.status === 'completed' && (
          <Text style={[styles.cardBadge, { backgroundColor: '#0066CC' }]}>Hoàn thành</Text>
        )}
        {goal.status === 'overdue' && (
          <Text style={[styles.cardBadge, { backgroundColor: '#CC3300' }]}>Quá hạn</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SavingsGoalsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('in_progress');
  const [allGoals, setAllGoals] = useState([]);
  const [totalLocked, setTotalLocked] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listGoals();
      setAllGoals(data.items || []);
      setTotalLocked(data.total_locked || 0);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchGoals(); }, [fetchGoals]));

  const handleDelete = (goal) => {
    Alert.alert(
      'Xóa mục tiêu',
      `Bạn có chắc muốn xóa mục tiêu "${goal.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              fetchGoals(true);
            } catch (e) {
              Alert.alert('Lỗi', e.message);
            }
          },
        },
      ],
    );
  };

  const filtered = allGoals.filter((g) => g.status === activeTab);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mục tiêu tiết kiệm</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddSavingsGoal', { goal: null })}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Total locked */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Tổng tiền đang tích lũy</Text>
        <Text style={styles.summaryAmount}>{_fmtVND(totalLocked)}</Text>
        <Text style={styles.summaryNote}>({allGoals.filter(g => g.status === 'in_progress').length} mục tiêu đang thực hiện)</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {STATUS_TABS.map((tab) => {
          const count = allGoals.filter((g) => g.status === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#075c09" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGoals(true); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'in_progress' ? 'Chưa có mục tiêu nào\nNhấn + để tạo mục tiêu mới' :
                 activeTab === 'completed' ? 'Chưa có mục tiêu nào hoàn thành' :
                 'Không có mục tiêu quá hạn'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={() => navigation.navigate('AddSavingsGoal', { goal: item })}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}
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

  summaryBox: {
    backgroundColor: '#075c09',
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  summaryAmount: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  summaryNote: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#333' },
  deleteIcon: { fontSize: 16 },

  progressTrack: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  cardRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  cardSaved: { fontSize: 15, fontWeight: '700', color: '#333' },
  cardTarget: { fontSize: 13, color: '#888' },
  cardPct: { marginLeft: 'auto', fontSize: 14, fontWeight: '700' },

  cardFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8, gap: 4 },
  cardInfo: { fontSize: 12, color: '#888' },
  cardMissing: { fontSize: 12, color: '#CC3300' },
  cardMonthly: { fontSize: 12, color: '#075c09', fontWeight: '600' },
  cardBadge: {
    alignSelf: 'flex-start',
    color: '#fff', fontSize: 11, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden',
  },
});
