import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import SidebarDrawer from '../components/SidebarDrawer';
import Header from '../components/Header';
import Footer from '../components/Footer';

const expenseCategories = [
  { id: '1', name: 'Thức ăn', icon: require('../../assets/hot-coffee.png'), backgroundColor: '#FF6B6B' },
  { id: '2', name: 'Quà tặng', icon: require('../../assets/gift.png'), backgroundColor: '#FFD93D' },
  { id: '3', name: 'Sức khỏe', icon: require('../../assets/cardiogram.png'), backgroundColor: '#6BCB77' },
  { id: '4', name: 'Giáo dục', icon: require('../../assets/graduation-cap.png'), backgroundColor: '#4D96FF' },
];

const incomeCategories = [
  { id: '5', name: 'Lương', icon: require('../../assets/wallet.png'), backgroundColor: '#9D84B7' },
  { id: '6', name: 'Ngân hàng', icon: require('../../assets/bank-building.png'), backgroundColor: '#FF8C42' },
];

export default function CategoriesScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: item.backgroundColor }]}>
      <Image source={item.icon} style={styles.categoryIcon} />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <Header 
        title="Danh mục"
        rightIcon="📋"
        onMenuPress={() => setSidebarOpen(true)}
        onRightPress={() => navigation.navigate('Transaction')}
      />
      <ScrollView style={styles.content} scrollEnabled={true}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'expense' && styles.tabActive]} onPress={() => setActiveTab('expense')}>
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>Chi phí</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'income' && styles.tabActive]} onPress={() => setActiveTab('income')}>
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>Thu nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
      <Footer />

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, backgroundColor: '#f8f9fa' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#075c09' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },
  contentContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 10,
    marginHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 45,
    height: 45,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});
