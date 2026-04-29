import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Modal,
  TextInput, ActivityIndicator, Alert, TouchableWithoutFeedback,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CategoryIcon from '../components/CategoryIcon';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/categoriesApi';

const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC43D', '#06D6A0', '#118AB2',
  '#6A4C93', '#F72585', '#4CC9F0', '#7FB069', '#B5838D',
];

// Ionicons names grouped by theme
const ICON_LIST = [
  // Ăn uống
  'fast-food', 'cafe', 'restaurant', 'pizza', 'nutrition', 'beer', 'ice-cream', 'wine',
  // Di chuyển
  'car', 'bus', 'airplane', 'bicycle', 'boat', 'train', 'walk', 'subway',
  // Sức khỏe & thể thao
  'medical', 'fitness', 'heart', 'barbell', 'football', 'basketball', 'tennisball', 'bandage',
  // Nhà ở & tiện ích
  'home', 'cart', 'bed', 'hammer', 'bulb', 'water', 'flash', 'tv',
  // Tài chính
  'cash', 'card', 'wallet', 'trending-up', 'trending-down', 'bar-chart', 'pricetag', 'stats-chart',
  // Giải trí & học tập
  'film', 'game-controller', 'musical-notes', 'book', 'brush', 'camera', 'headset', 'school',
  // Công việc
  'briefcase', 'laptop', 'desktop', 'print', 'documents', 'clipboard', 'build', 'library',
  // Khác
  'gift', 'trophy', 'ribbon', 'star', 'pin', 'flag', 'globe', 'people',
  'shirt', 'paw', 'leaf', 'phone-portrait', 'shield', 'ellipsis-horizontal',
];

const EMPTY_FORM = { name: '', type: 'expense', icon: 'ellipsis-horizontal', color: '#FF6B6B' };

export default function CategoriesScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listCategories();
      setCategories(data);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = categories.filter(c => c.type === activeTab);
  const gridData = [...filtered, { id: '__add__' }];

  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, type: activeTab });
    setModalVisible(true);
  }

  function openEdit(cat) {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon || 'ellipsis-horizontal',
      color: cat.color || '#FF6B6B',
    });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Lỗi', 'Tên danh mục không được để trống');
      return;
    }
    try {
      setSaving(true);
      if (editTarget) {
        await updateCategory(editTarget.id, {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
        });
      } else {
        await createCategory({
          name: form.name.trim(),
          type: form.type,
          icon: form.icon,
          color: form.color,
        });
      }
      setModalVisible(false);
      fetchCategories();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(cat) {
    Alert.alert(
      'Xóa danh mục',
      `Xóa "${cat.name}"?\nDữ liệu giao dịch lịch sử sẽ được giữ nguyên.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              setModalVisible(false);
              fetchCategories();
            } catch (e) {
              Alert.alert('Lỗi', e.message);
            }
          },
        },
      ]
    );
  }

  const renderItem = ({ item }) => {
    if (item.id === '__add__') {
      return (
        <TouchableOpacity style={[styles.categoryCard, styles.addCard]} onPress={openAdd}>
          <Text style={styles.addPlus}>+</Text>
          <Text style={styles.addLabel}>Thêm</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.categoryCard, { backgroundColor: item.color || '#888' }]}
        onPress={() => openEdit(item)}
      >
        <CategoryIcon icon={item.icon} size={36} color="#fff" />
        <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Danh mục"
        rightIcon="📋"
        onMenuPress={() => setSidebarOpen(true)}
        onRightPress={() => navigation.navigate('Transaction')}
      />

      <View style={styles.tabBar}>
        {[['expense', 'Chi phí'], ['income', 'Thu nhập']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#075c09" />
      ) : (
        <FlatList
          data={gridData}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Footer />
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />

      {/* ── Add / Edit bottom sheet ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editTarget ? 'Sửa danh mục' : 'Thêm danh mục'}
              </Text>
              {editTarget && (
                <TouchableOpacity onPress={() => confirmDelete(editTarget)}>
                  <Text style={styles.deleteLink}>Xóa</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Live preview */}
              <View style={styles.previewRow}>
                <View style={[styles.previewCircle, { backgroundColor: form.color }]}>
                  <CategoryIcon icon={form.icon} size={32} color="#fff" />
                </View>
                <Text style={styles.previewName} numberOfLines={1}>
                  {form.name.trim() || 'Tên danh mục'}
                </Text>
              </View>

              {/* Type selector — only when adding */}
              {!editTarget && (
                <>
                  <Text style={styles.fieldLabel}>Loại</Text>
                  <View style={styles.typeRow}>
                    {[['expense', 'Chi phí'], ['income', 'Thu nhập']].map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.typeChip, form.type === key && styles.typeChipActive]}
                        onPress={() => setForm(f => ({ ...f, type: key }))}
                      >
                        <Text style={[styles.typeChipText, form.type === key && styles.typeChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Name */}
              <Text style={styles.fieldLabel}>Tên</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Nhập tên danh mục..."
                placeholderTextColor="#aaa"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                maxLength={50}
              />

              {/* Color */}
              <Text style={styles.fieldLabel}>Màu</Text>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      form.color === c && styles.colorDotActive,
                    ]}
                    onPress={() => setForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </View>

              {/* Icon */}
              <Text style={styles.fieldLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_LIST.map(name => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.iconCell, form.icon === name && styles.iconCellActive]}
                    onPress={() => setForm(f => ({ ...f, icon: name }))}
                  >
                    <Ionicons
                      name={name}
                      size={26}
                      color={form.icon === name ? '#075c09' : '#555'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fa' },
  loader: { marginTop: 48 },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#075c09' },
  tabText: { fontSize: 15, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },

  // ── Grid ──────────────────────────────────────────────────────────────────
  listContent: { padding: 16 },
  row: { justifyContent: 'flex-start', marginBottom: 20 },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  catIcon: { marginBottom: 4 },
  catName: { fontSize: 11, fontWeight: '600', color: '#fff', textAlign: 'center', paddingHorizontal: 6 },

  // Add button card
  addCard: { backgroundColor: '#e8f5e9', borderWidth: 2, borderColor: '#075c09', borderStyle: 'dashed' },
  addPlus: { fontSize: 28, color: '#075c09', fontWeight: '300' },
  addLabel: { fontSize: 12, color: '#075c09', fontWeight: '600' },

  // ── Modal / Bottom sheet ──────────────────────────────────────────────────
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  deleteLink: { fontSize: 15, color: '#e74c3c', fontWeight: '600' },

  // Preview
  previewRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  previewCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  previewName: { fontSize: 18, fontWeight: '700', color: '#333', flex: 1 },

  // Type selector
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeChipActive: { borderColor: '#075c09', backgroundColor: '#e8f5e9' },
  typeChipText: { fontSize: 14, color: '#999', fontWeight: '600' },
  typeChipTextActive: { color: '#075c09' },

  // Name input
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 4 },
  nameInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    marginBottom: 14,
  },

  // Color picker
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotActive: { borderWidth: 3, borderColor: '#333' },

  // Ionicons picker grid
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  iconCell: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  iconCellActive: { backgroundColor: '#e8f5e9', borderWidth: 2, borderColor: '#075c09' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#075c09',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
