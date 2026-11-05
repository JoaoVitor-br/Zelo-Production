import React from 'react';
import { Text as NativeText } from 'react-native';
import { FONTS } from '../theme';

export default function AppText({ style, ...props }) {
  return <NativeText {...props} style={[{ fontFamily: FONTS.body }, style]} />;
}
