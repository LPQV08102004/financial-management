import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Footer from '../components/Footer';
import { sendChatMessage, parseTransaction, parseSavingsAction, parseReceipt } from '../api/chatApi';
import { useChatContext } from '../context/ChatContext';
import TransactionConfirmCard from '../components/TransactionConfirmCard';
import SavingsConfirmCard from '../components/SavingsConfirmCard';
import ReceiptConfirmCard from '../components/ReceiptConfirmCard';

const SUGGESTED = [
  'Tháng này tôi chi tiêu bao nhiêu?',
  'Thu nhập tháng này là bao nhiêu?',
  'Tôi có tiết kiệm được không?',
  'Cho tôi xem 10 giao dịch gần nhất',
];

export default function ChatScreen({ navigation }) {
  const { messages, setMessages, resetMessages } = useChatContext();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [nlpMode, setNlpMode] = useState(false);
  const [savingsMode, setSavingsMode] = useState(false);
  const [ocrMode, setOcrMode] = useState(false);
  const [parsedTxn, setParsedTxn] = useState(null);
  const [parsedSavings, setParsedSavings] = useState(null);
  const listRef = useRef(null);

  const getHistory = (msgs) =>
    msgs
      .filter((m) => m.id !== '0' && m.type !== 'card')
      .map((m) => ({ role: m.role, content: m.content }));

  const send = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      if (nlpMode) {
        setNlpMode(false);
        const result = await parseTransaction(userText);
        setParsedTxn(result);
        setMessages((prev) => {
          const newMsgs = [];
          if (result.warning) {
            newMsgs.push({
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: result.warning,
            });
          }
          newMsgs.push({
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            type: 'card',
            content: '__card__',
            parsed: result,
          });
          return [...prev, ...newMsgs];
        });
      } else if (savingsMode) {
        setSavingsMode(false);
        const result = await parseSavingsAction(userText);
        setParsedSavings(result);
        setMessages((prev) => {
          const newMsgs = [];
          if (result.warning) {
            newMsgs.push({
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: result.warning,
            });
          }
          newMsgs.push({
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            type: 'savings-card',
            content: '__savings-card__',
            parsed: result,
          });
          return [...prev, ...newMsgs];
        });
      } else {
        const reply = await sendChatMessage(userText, getHistory(nextMessages));
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, nlpMode, savingsMode]);

  const handleCardConfirmed = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, confirmed: true, content: '✅ Giao dịch đã được lưu thành công!' }
          : m
      )
    );
    setParsedTxn(null);
  };

  const handleCardCancel = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, confirmed: true, content: '🚫 Đã huỷ giao dịch.' }
          : m
      )
    );
    setParsedTxn(null);
  };

  const handleSavingsCardConfirmed = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, confirmed: true, content: '✅ Đã nạp/rút tiền tiết kiệm thành công!' }
          : m
      )
    );
    setParsedSavings(null);
  };

  const handleSavingsCardCancel = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, confirmed: true, content: '🚫 Đã huỷ.' }
          : m
      )
    );
    setParsedSavings(null);
  };

  const handleOCRScan = () => {
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
            if (!result.canceled) _processOCRForChat(result.assets[0]);
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
            if (!result.canceled) _processOCRForChat(result.assets[0]);
          },
        },
        { text: 'Huỷ', style: 'cancel' },
      ]
    );
    setOcrMode(false);
  };

  const _processOCRForChat = async (asset) => {
    setLoading(true);
    const placeholderId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: 'user', content: '📸 [Hóa đơn đã gửi]' },
    ]);
    try {
      const result = await parseReceipt(asset.base64);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          type: 'receipt-card',
          content: '__receipt-card__',
          parsed: result,
          imageUri: asset.uri,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptCardConfirmed = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, confirmed: true, content: '✅ Giao dịch từ hóa đơn đã được lưu!' }
          : m
      )
    );
  };

  const handleReceiptCardCancel = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, confirmed: true, content: '🚫 Đã huỷ hóa đơn.' }
          : m
      )
    );
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';

    if (item.type === 'card' && !item.confirmed) {
      return (
        <TransactionConfirmCard
          parsed={item.parsed}
          onConfirmed={() => handleCardConfirmed(item.id)}
          onCancel={() => handleCardCancel(item.id)}
        />
      );
    }

    if (item.type === 'savings-card' && !item.confirmed) {
      return (
        <SavingsConfirmCard
          parsed={item.parsed}
          onConfirmed={() => handleSavingsCardConfirmed(item.id)}
          onCancel={() => handleSavingsCardCancel(item.id)}
        />
      );
    }

    if (item.type === 'receipt-card' && !item.confirmed) {
      return (
        <ReceiptConfirmCard
          parsed={item.parsed}
          imageUri={item.imageUri}
          onConfirmed={() => handleReceiptCardConfirmed(item.id)}
          onCancel={() => handleReceiptCardCancel(item.id)}
        />
      );
    }

    const isWarning = !isUser && item.content && item.content.startsWith('⚠️');

    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : isWarning ? styles.bubbleWarning : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : isWarning ? styles.bubbleTextWarning : styles.bubbleTextAI]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤖 Trợ lý tài chính</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Xoá cuộc trò chuyện', 'Bạn có chắc muốn xoá toàn bộ tin nhắn?', [
              { text: 'Huỷ', style: 'cancel' },
              { text: 'Xoá', style: 'destructive', onPress: resetMessages },
            ]);
          }}
          style={styles.clearBtn}
        >
          <Text style={styles.clearBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>

      {}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#075c09" />
          <Text style={styles.loadingText}>
            {nlpMode ? 'Đang phân tích giao dịch...' : savingsMode ? 'Đang phân tích tiết kiệm...' : ocrMode ? 'Đang đọc hóa đơn...' : 'Đang trả lời...'}
          </Text>
        </View>
      )}

      {}
      {nlpMode && !loading && (
        <View style={styles.nlpBanner}>
          <Text style={styles.nlpBannerText}>
            📝 Mô tả giao dịch bằng câu tự nhiên, VD: "Tối qua ăn Haidilao hết 220k"
          </Text>
          <TouchableOpacity onPress={() => setNlpMode(false)}>
            <Text style={styles.nlpBannerCancel}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      )}

      {}
      {savingsMode && !loading && (
        <View style={[styles.nlpBanner, styles.savingsBanner]}>
          <Text style={[styles.nlpBannerText, styles.savingsBannerText]}>
            🏦 Mô tả hành động tiết kiệm, VD: "Nạp 100k vào quỹ du lịch"
          </Text>
          <TouchableOpacity onPress={() => setSavingsMode(false)}>
            <Text style={styles.nlpBannerCancel}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      )}

      {}
      {!loading && messages.length <= 1 && !nlpMode && !savingsMode && (
        <View style={styles.suggestionsContainer}>
          {SUGGESTED.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => send(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {}
      <View style={styles.inputBar}>
        {}
        <TouchableOpacity
          style={[styles.nlpBtn, nlpMode && styles.nlpBtnActive]}
          onPress={() => { setNlpMode((v) => !v); setSavingsMode(false); setOcrMode(false); }}
          disabled={loading}
        >
          <Text style={styles.nlpBtnIcon}>🧾</Text>
        </TouchableOpacity>
        {}
        <TouchableOpacity
          style={[styles.nlpBtn, savingsMode && styles.savingsBtnActive]}
          onPress={() => { setSavingsMode((v) => !v); setNlpMode(false); setOcrMode(false); }}
          disabled={loading}
        >
          <Text style={styles.nlpBtnIcon}>🏦</Text>
        </TouchableOpacity>
        {}
        <TouchableOpacity
          style={[styles.nlpBtn, ocrMode && styles.ocrBtnActive]}
          onPress={() => { setOcrMode(true); setNlpMode(false); setSavingsMode(false); handleOCRScan(); }}
          disabled={loading}
        >
          <Text style={styles.nlpBtnIcon}>📸</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={nlpMode ? 'VD: Uống cafe 45k hôm nay...' : savingsMode ? 'VD: Nạp 100k vào quỹ du lịch...' : 'Nhập câu hỏi...'}
          placeholderTextColor="#999"
          multiline
          returnKeyType="send"
          onSubmitEditing={() => send()}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
      <Footer />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075c09',
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: { marginRight: 12 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 20 },

  listContent: { padding: 16, paddingBottom: 40 },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#075c09',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleWarning: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff8e1',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ffe082',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: '#222' },
  bubbleTextWarning: { color: '#7b4800' },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  loadingText: { color: '#666', fontSize: 13 },

  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  suggestionText: { color: '#075c09', fontSize: 13 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#075c09',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendIcon: { color: '#fff', fontSize: 16 },

  nlpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  nlpBtnActive: { backgroundColor: '#075c09', borderColor: '#075c09' },
  nlpBtnIcon: { fontSize: 18 },

  nlpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#c8e6c9',
    justifyContent: 'space-between',
  },
  nlpBannerText: { color: '#075c09', fontSize: 13, flex: 1, marginRight: 8 },
  nlpBannerCancel: { color: '#d9534f', fontSize: 13, fontWeight: '600' },

  savingsBanner: { backgroundColor: '#e3f2fd', borderTopColor: '#90caf9' },
  savingsBannerText: { color: '#1565c0' },
  savingsBtnActive: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  ocrBtnActive: { backgroundColor: '#6a1b9a', borderColor: '#6a1b9a' },
});
