
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import { colors, radius } from '../../theme';

interface SkeletonProps {
  width: ViewStyle['width'];
  height: ViewStyle['height'];
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width,
  height,
  borderRadius = radius.medium,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceSecondary,
  },
});
