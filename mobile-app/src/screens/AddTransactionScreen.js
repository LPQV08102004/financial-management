import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Footer from '../components/Footer';
import CategoryIcon from '../components/CategoryIcon';
import ReceiptConfirmCard from '../components/ReceiptConfirmCard';
import { listCategories } from '../api/categoriesApi';
import { listAccounts } from '../api/accountsApi';
import { createIncome, createExpense } from '../api/transactionsApi';
import { parseReceipt } from '../api/chatApi';

export default function AddTransactionScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [images, setImages] = useState([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorDisplay, setCalculatorDisplay] = useState('0');
  const [calculatorInput, setCalculatorInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrImageUri, setOcrImageUri] = useState(null);

  useEffect(() => {
    listAccounts().then((list) => {
      setAccounts(list);
      if (list.length > 0) setSelectedAccount(list[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
    listCategories(activeTab).then(setCategories).catch(() => {});
  }, [activeTab]);

  const handleAmountChange = (text) => {
    let numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.startsWith('0') && numericValue.length > 1) {
      numericValue = numericValue.slice(1);
    }
    // Cap at account balance for expense
    if (activeTab === 'expense' && selectedAccount) {
      const cap = Math.floor(Number(selectedAccount.current_balance));
      if (Number(numericValue) > cap) numericValue = String(cap);
    }
    setAmount(numericValue);
  };

  const formatAmount = (value) => {
    if (!value) return '';
    // Thêm dấu chấm phân tách hàng nghìn
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatDate = (date) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    
    const day = date.getDate();
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleSelectDate = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const handlePickImage = async () => {
    if (images.length >= 3) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleScanReceipt = async () => {
    Alert.alert(
      'Quét hóa đơn',
      'Chọn nguồn ảnh',
      [
        {
          text: 'Chụp ảnh',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled) _processOCR(result.assets[0]);
          },
        },
        {
          text: 'Chọn từ thư viện',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled) _processOCR(result.assets[0]);
          },
        },
        { text: 'Huỷ', style: 'cancel' },
      ]
    );
  };

  const _processOCR = async (asset) => {
    setOcrLoading(true);
    setOcrImageUri(asset.uri);
    try {
      const result = await parseReceipt(asset.base64);
      setOcrResult(result);
    } catch (err) {
      Alert.alert('Lỗi OCR', err.message || 'Không thể đọc hóa đơn. Vui lòng thử lại.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCalculatorInput = (value) => {
    if (value === '=') {
      try {
        const result = eval(calculatorDisplay.replace(/×/g, '*').replace(/÷/g, '/'));
        setCalculatorDisplay(String(result));
      } catch (error) {
        setCalculatorDisplay('Lỗi');
      }
    } else if (value === 'C') {
      setCalculatorDisplay('0');
    } else if (value === '←') {
      const newDisplay = calculatorDisplay.slice(0, -1) || '0';
      setCalculatorDisplay(newDisplay);
    } else {
      if (calculatorDisplay === '0' && value !== '.' && !isNaN(value)) {
        setCalculatorDisplay(value);
      } else {
        setCalculatorDisplay(calculatorDisplay + value);
      }
    }
  };

  const handleCalculatorConfirm = () => {
    if (calculatorDisplay !== 'Lỗi' && calculatorDisplay !== '0') {
      setAmount(calculatorDisplay.replace(/[^0-9]/g, ''));
      setCalculatorDisplay('0');
      setShowCalculator(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddTransaction = async () => {
    if (!amount.trim()) return;

    if (accounts.length === 0) {
      Alert.alert('Lỗi', 'Bạn chưa có tài khoản nào. Vui lòng tạo tài khoản trước.');
      return;
    }

    if (activeTab === 'expense' && !selectedCategory) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục cho khoản chi.');
      return;
    }

    const account_id = (selectedAccount ?? accounts[0]).id;
    const transaction_date = selectedDate.toISOString();
    const amountNum = parseFloat(amount);

    try {
      setSubmitting(true);
      if (activeTab === 'income') {
        await createIncome({
          account_id,
          amount: amountNum,
          transaction_date,
          note: description || null,
          category_id: selectedCategory?.id || null,
        });
      } else {
        await createExpense({
          account_id,
          category_id: selectedCategory.id,
          amount: amountNum,
          transaction_date,
          note: description || null,
        });
      }
      handleGoBack();
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thêm được giao dịch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm giao dịch</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>
            Chi phí
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            Thu nhập
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số tiền</Text>
          {activeTab === 'expense' && selectedAccount && (
            <Text style={styles.balanceHint}>
              Số dư: {Number(selectedAccount.current_balance).toLocaleString('vi-VN')} đ
            </Text>
          )}
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
              value={formatAmount(amount)}
              onChangeText={handleAmountChange}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.calculatorButton}
              onPress={() => setShowCalculator(true)}
            >
              <Text style={styles.calculatorIcon}>🧮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.categorySection}>
          <Text style={styles.label}>Danh mục</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === category.id && styles.categoryItemSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <CategoryIcon icon={category.icon} size={32} color={category.color || '#075c09'} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>+</Text>
              <Text style={styles.categoryViewMore}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <Text style={styles.label}>Ngày</Text>
          <TouchableOpacity 
            style={styles.dateContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Nhập ghi chú"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageSectionHeader}>
            {/* <Text style={styles.label}>Ảnh (Tùy chọn)</Text> */}
            <TouchableOpacity
              style={styles.scanReceiptBtn}
              onPress={handleScanReceipt}
              disabled={ocrLoading}
            >
              {ocrLoading
                ? <ActivityIndicator size="small" color="#1565c0" />
                : <Text style={styles.scanReceiptText}>📸 Quét hóa đơn</Text>
              }
            </TouchableOpacity>
          </View>
          {/* <View style={styles.imageGrid}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.imageBox}>
                {images[index] ? (
                  <TouchableOpacity 
                    style={styles.imageContainer}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Image 
                      source={{ uri: images[index] }} 
                      style={styles.uploadedImage}
                    />
                    <View style={styles.removeImageButton}>
                      <Text style={styles.removeImageText}>×</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.addImageButton}
                    onPress={handlePickImage}
                  >
                    <Text style={styles.addImageIcon}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View> */}
        </View>

        <TouchableOpacity
          style={[styles.addButton, submitting && { opacity: 0.6 }]}
          onPress={handleAddTransaction}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addButtonText}>Thêm giao dịch</Text>}
        </TouchableOpacity>
      </ScrollView>
      <Footer />

      {/* OCR Receipt Confirmation Modal */}
      <Modal visible={!!ocrResult} animationType="slide" onRequestClose={() => setOcrResult(null)}>
        <View style={styles.ocrModalContainer}>
          <View style={styles.ocrModalHeader}>
            <TouchableOpacity onPress={() => setOcrResult(null)} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Xác nhận hóa đơn</Text>
          </View>
          {ocrResult && (
            <ReceiptConfirmCard
              parsed={ocrResult}
              imageUri={ocrImageUri}
              onConfirmed={() => {
                setOcrResult(null);
                navigation.goBack();
              }}
              onCancel={() => setOcrResult(null)}
            />
          )}
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePreviousMonth}>
                <Text style={styles.calendarArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <Text style={styles.calendarArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Days header */}
            <View style={styles.calendarDaysHeader}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar days */}
            <View style={styles.calendarDays}>
              {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDay} />
              ))}
              {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDate.getDate() === day && 
                                  selectedDate.getMonth() === currentMonth.getMonth() &&
                                  selectedDate.getFullYear() === currentMonth.getFullYear();
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                    onPress={() => handleSelectDate(day)}
                  >
                    <Text style={[styles.calendarDayText, isSelected && styles.calendarDaySelectedText]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={styles.calendarCloseButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.calendarCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calculator Modal */}
      <Modal visible={showCalculator} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorModal}>
            <View style={styles.calculatorHeader}>
              <Text style={styles.calculatorTitle}>Máy tính</Text>
              <TouchableOpacity onPress={() => setShowCalculator(false)}>
                <Text style={styles.calculatorCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calculatorDisplay}>
              <Text style={styles.calculatorDisplayText}>{calculatorDisplay}</Text>
            </View>

            <View style={styles.calculatorGrid}>
              {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
                <TouchableOpacity
                  key={btn}
                  style={[
                    styles.calculatorBtn,
                    ['÷', '×', '-', '+', '='].includes(btn) && styles.calculatorOperatorBtn,
                  ]}
                  onPress={() => handleCalculatorInput(btn)}
                >
                  <Text style={[
                    styles.calculatorBtnText,
                    ['÷', '×', '-', '+', '='].includes(btn) && styles.calculatorOperatorText
                  ]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.calculatorBottomButtons}>
              <TouchableOpacity 
                style={styles.calculatorClearBtn}
                onPress={() => handleCalculatorInput('C')}
              >
                <Text style={styles.calculatorBtnText}>C</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.calculatorBackBtn}
                onPress={() => handleCalculatorInput('←')}
              >
                <Text style={styles.calculatorBtnText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.calculatorConfirmBtn}
                onPress={handleCalculatorConfirm}
              >
                <Text style={styles.calculatorConfirmText}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#075c09',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 30,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#075c09',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#075c09',
  },
  form: {
    padding: 20,
  },
  formContent: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 18,
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  descriptionInput: {
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#075c09',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  categoryItemSelected: {
    borderColor: '#075c09',
    backgroundColor: '#f0f7ed',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  categoryViewMore: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  calendarIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarArrow: {
    fontSize: 24,
    color: '#075c09',
    fontWeight: 'bold',
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075c09',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: '#075c09',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDaySelectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarCloseButton: {
    backgroundColor: '#075c09',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageBox: {
    flex: 1,
    aspectRatio: 1,
  },
  addImageButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addImageIcon: {
    fontSize: 36,
    color: '#999',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    flex: 1,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  calculatorButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  calculatorIcon: {
    fontSize: 24,
  },
  balanceHint: {
    fontSize: 12,
    color: '#075c09',
    fontWeight: '600',
    marginBottom: 4,
  },
  calculatorModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075c09',
  },
  calculatorCloseIcon: {
    fontSize: 28,
    color: '#999',
  },
  calculatorDisplay: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  calculatorDisplayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  calculatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  calculatorBtn: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  calculatorOperatorBtn: {
    backgroundColor: '#075c09',
    borderColor: '#075c09',
  },
  calculatorBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  calculatorOperatorText: {
    color: '#fff',
  },
  calculatorBottomButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  calculatorClearBtn: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorBackBtn: {
    flex: 1,
    backgroundColor: '#ffa500',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorConfirmBtn: {
    flex: 1,
    backgroundColor: '#075c09',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorConfirmText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  scanReceiptText: {
    color: '#1565c0',
    fontSize: 13,
    fontWeight: '600',
  },
  ocrModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  ocrModalHeader: {
    backgroundColor: '#1565c0',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
});
