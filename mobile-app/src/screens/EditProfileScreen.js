import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../api/authApi';

export default function EditProfileScreen({ navigation }) {
  const { state, updateUser } = useAuth();
  const user = state.user;
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || null);
  const [originalAvatarUri, setOriginalAvatarUri] = useState(user?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhoneNumber(user?.phone_number || '');
    setAvatarUri(user?.avatar_url || null);
    setOriginalAvatarUri(user?.avatar_url || null);
  }, [user]);

  const pickImage = async (source) => {
    try {
      setShowImageOptions(false);
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
          exif: false,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
          exif: false,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Use asset.mimeType for correct type (same pattern as chatbot OCR)
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${asset.base64}`;

        // 16MB cap — base64 is ~4/3x original file size
        const MAX_BASE64 = 16 * 1024 * 1024;
        if (dataUri.length > MAX_BASE64) {
          Alert.alert('Lỗi', 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 12MB.');
          return;
        }
        setAvatarUri(dataUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleSave = async () => {
    // fullName could be pre-filled from user — only block if truly empty after editing
    if (fullName !== undefined && fullName.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return;
    }

    if (phoneNumber && !/^(0\d{9,10}|\+84\d{9,10})$/.test(phoneNumber)) {
      Alert.alert('Lỗi', 'Định dạng số điện thoại không hợp lệ');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: fullName,
        phone_number: phoneNumber || null,
      };

      // Only include avatar_url when it changed
      if (avatarUri !== originalAvatarUri) {
        payload.avatar_url = avatarUri; // data URI (data:image/...;base64,...), http URL, or null
      }

      const updatedUser = await updateMyProfile(payload);
      updateUser(updatedUser);

      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Lỗi', error.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#075c09" />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenu} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Chỉnh sửa hồ sơ</Text>
          </View>
          <View style={styles.headerSpacer}></View>
        </View>

        {/* Content */}
        <View style={styles.contentWrapper}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionTitle}>Ảnh đại diện</Text>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>👤</Text>
                </View>
              )}
            </View>
            <View style={styles.avatarButtonContainer}>
              <TouchableOpacity
                style={styles.avatarActionButton}
                onPress={() => setShowImageOptions(true)}
              >
                <Text style={styles.avatarActionButtonText}>Thay đổi ảnh</Text>
              </TouchableOpacity>
              {avatarUri && (
                <TouchableOpacity
                  style={[styles.avatarActionButton, styles.removeButton]}
                  onPress={() => {
                    setAvatarUri(null);
                  }}
                >
                  <Text style={styles.removeButtonText}>Xóa ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên đầy đủ</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập tên"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                editable={!saving}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!saving}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Image Options Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showImageOptions}
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn nguồn ảnh</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => pickImage('camera')}
            >
              <Text style={styles.modalOptionText}>📷 Chụp ảnh mới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => pickImage('library')}
            >
              <Text style={styles.modalOptionText}>🖼️ Chọn từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.cancelOptionText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#075c09',
    padding: 20,
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMenu: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backArrow: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 30,
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 50,
  },
  contentWrapper: {
    padding: 20,
  },
  avatarSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075c09',
    marginBottom: 15,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#075c09',
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(7, 92, 9, 0.1)',
    borderWidth: 3,
    borderColor: '#075c09',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 70,
  },
  avatarButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  avatarActionButton: {
    backgroundColor: '#075c09',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  avatarActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#075c09',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  formHelper: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#075c09',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#075c09',
  },
  cancelButtonText: {
    color: '#075c09',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#075c09',
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelOption: {
    borderColor: '#ccc',
    marginTop: 10,
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
});
