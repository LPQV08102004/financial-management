import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import SidebarDrawer from '../components/SidebarDrawer';
import HeaderIconButton from '../components/HeaderIconButton';

export default function CategoriesScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} scrollEnabled={true}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => setSidebarOpen(true)}>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
            <View style={styles.hamburgerLine}></View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerLabelContainer}>
              <Text style={styles.headerText}>Danh mục</Text>
            </View>
          </View>
          <HeaderIconButton icon="📋" onPress={() => navigation.navigate('Transaction')} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'expense' && styles.tabActive]} onPress={() => setActiveTab('expense')}>
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>Chi phí</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'income' && styles.tabActive]} onPress={() => setActiveTab('income')}>
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>Thu nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Content will go here */}
        <View style={styles.contentContainer}>
          <Text style={styles.placeholderText}>Nội dung danh mục</Text>
        </View>
      </ScrollView>

      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: 'relative' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    backgroundColor: '#075c09', 
    padding: 20, 
    paddingTop: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  headerMenu: { paddingHorizontal: 10, paddingVertical: 10 },
  hamburgerLine: { 
    width: 24, 
    height: 3, 
    backgroundColor: '#fff', 
    marginVertical: 4, 
    marginTop: 3, 
    borderRadius: 2 
  },
  headerContent: { flex: 1, alignItems: 'center', paddingRight: 30 },
  headerLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  iconLabel: { fontSize: 24, marginRight: 8, color: '#fff' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#075c09' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#075c09' },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});
