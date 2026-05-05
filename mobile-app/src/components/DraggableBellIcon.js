import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DraggableBellIcon = ({
  size = 50,
  color = '#007AFF',
}) => {
  const { width, height } = Dimensions.get('window');
  const pan = useRef(new Animated.ValueXY({ x: width - size - 20, y: height / 2 - size / 2 })).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newX = gestureState.x0 - size / 2 + gestureState.dx;
        const newY = gestureState.y0 - size / 2 + gestureState.dy;

        // Constrain within bounds
        const constrainedX = Math.max(0, Math.min(newX, width - size));
        const constrainedY = Math.max(0, Math.min(newY, height - size - 50));

        pan.x.setValue(constrainedX);
        pan.y.setValue(constrainedY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);

        // Get current position
        let currentX = gestureState.x0 - size / 2 + gestureState.dx;
        let currentY = gestureState.y0 - size / 2 + gestureState.dy;

        currentX = Math.max(0, Math.min(currentX, width - size));
        currentY = Math.max(0, Math.min(currentY, height - size - 50));

        // Snap only horizontally (left or right edge)
        const centerX = currentX + size / 2;
        let snapX = currentX;

        if (centerX < width / 2) {
          snapX = 10;
        } else {
          snapX = width - size - 10;
        }

        // Keep vertical position as is (don't snap vertically)
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
      >
        <Ionicons
          name="notifications"
          size={size * 0.6}
          color={color}
          style={{ marginTop: 2 }}
        />
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
});

export default DraggableBellIcon;
