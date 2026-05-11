import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DraggableBellIcon = ({
  size = 70,
  color = '#007AFF',
  navigation,
  unreadCount = 0,
}) => {
  const { width, height } = Dimensions.get('window');
  const pan = useRef(new Animated.ValueXY({ x: width - size - 20, y: height / 2 - size / 2 })).current;
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const TAP_THRESHOLD = 10;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        dragStartPos.current = { x: gestureState.x0, y: gestureState.y0 };
        setIsDragging(false);
      },
      onPanResponderMove: (evt, gestureState) => {

        const distance = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);

        if (distance > TAP_THRESHOLD) {
          setIsDragging(true);
          const newX = gestureState.x0 - size / 2 + gestureState.dx;
          const newY = gestureState.y0 - size / 2 + gestureState.dy;

          const constrainedX = Math.max(0, Math.min(newX, width - size));
          const constrainedY = Math.max(0, Math.min(newY, height - size - 50));

          pan.x.setValue(constrainedX);
          pan.y.setValue(constrainedY);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {

        const distance = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);

        if (distance <= TAP_THRESHOLD) {

          setIsDragging(false);
          if (navigation && navigation.current) {
            navigation.current.navigate('NotificationScreen');
          }
          return;
        }

        setIsDragging(false);

        let currentX = gestureState.x0 - size / 2 + gestureState.dx;
        let currentY = gestureState.y0 - size / 2 + gestureState.dy;

        currentX = Math.max(0, Math.min(currentX, width - size));
        currentY = Math.max(0, Math.min(currentY, height - size - 50));

        const centerX = currentX + size / 2;
        let snapX = currentX;

        if (centerX < width / 2) {
          snapX = 10;
        } else {
          snapX = width - size - 10;
        }

        const snapY = currentY;

        Animated.parallel([
          Animated.spring(pan.x, {
            toValue: snapX,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }),
          Animated.timing(pan.y, {
            toValue: snapY,
            duration: 0,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

  const handlePress = () => {
    if (navigation && navigation.current && !isDragging) {
      navigation.current.navigate('NotificationScreen');
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            opacity: isDragging ? 0.9 : 1,
          },
        ]}
        onPress={handlePress}
      >
        <Ionicons
          name="notifications"
          size={size * 0.5}
          color={color}
          style={{ marginTop: 2 }}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  bubble: {
    borderRadius: 100,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default DraggableBellIcon;
