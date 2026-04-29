import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Image, FlatList } from 'react-native';
import Footer from '../components/Footer';

const categoryIcons = [
  { id: '1', name: 'Thức ăn', icon: require('../../assets/hot-coffee.png') },
  { id: '2', name: 'Quà tặng', icon: require('../../assets/gift.png') },
  { id: '3', name: 'Sức khỏe', icon: require('../../assets/cardiogram.png') },
  { id: '4', name: 'Giáo dục', icon: require('../../assets/graduation-cap.png') },
  { id: '5', name: 'Lương', icon: require('../../assets/wallet.png') },
  { id: '6', name: 'Ngân hàng', icon: require('../../assets/bank-building.png') },
  { id: 'dots', name: 'Xem thêm', icon: require('../../assets/dots.png'), isDots: true },
];

const basicColors = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#9D84B7',
  '#FF8C42',
  '#075c09',
];

export default function AddCategories({ navigation }) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  const [selectedIcon, setSelectedIcon] = useState(categoryIcons[0]);
  const [selectedColor, setSelectedColor] = useState(basicColors[0]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo danh mục</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.label}>Tên danh mục</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Ăn uống, Đi lại, Lương,..."
            placeholderTextColor="#999"
            value={categoryName}
            onChangeText={setCategoryName}
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                categoryType === 'expense' && styles.typeButtonActive,
              ]}
              onPress={() => setCategoryType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  categoryType === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Chi phí
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                categoryType === 'income' && styles.typeButtonActive,
              ]}
              onPress={() => setCategoryType('income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  categoryType === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Thu nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text style={styles.label}>Biểu tượng</Text>
          <View style={styles.iconGrid}>
            <FlatList
              data={categoryIcons}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconBox,
                    { backgroundColor: '#888888' },
                    selectedIcon?.id === item.id && styles.iconBoxSelected,
                  ]}
                  onPress={() => {
                    if (item.isDots) {
                      navigation.navigate('CategoriesList');
                    } else {
                      setSelectedIcon(item);
                    }
                  }}
                >
                  <Image source={item.icon} style={styles.iconImage} />
                  {selectedIcon?.id === item.id && !item.isDots && (
                    <View style={styles.checkmarkCircle}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={styles.columnWrapper}
              scrollEnabled={false}
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Màu sắc</Text>
          <View style={styles.colorGrid}>
            {basicColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorBox,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorBoxSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.colorBox, styles.addColorBox]}>
              <Text style={styles.addColorText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Thêm danh mục</Text>
        </TouchableOpacity>
      </ScrollView>

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
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },

  body: { flex: 1 },

  bodyContent: { padding: 16, gap: 20, paddingBottom: 40 },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#075c09',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },

  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  typeButtonActive: {
    borderColor: '#075c09',
    backgroundColor: '#e8f5e9',
  },

  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  typeButtonTextActive: {
    color: '#075c09',
  },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 1,
  },

  iconGrid: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
  },

  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 12,
  },

  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },

  iconBoxSelected: {
    borderWidth: 3,
    borderColor: '#075c09',
  },

  iconImage: {
    width: 40,
    height: 40,
  },

  checkmarkCircle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#075c09',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  colorBox: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },

  colorBoxSelected: {
    borderColor: '#075c09',
  },

  addColorBox: {
    backgroundColor: '#FFD93D',
    borderColor: 'transparent',
    borderWidth: 3,
    width: '22%',
    aspectRatio: 1,
    borderRadius: 50,
  },

  addColorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },

  addButton: {
    backgroundColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
