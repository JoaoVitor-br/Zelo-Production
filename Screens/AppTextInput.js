import React from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { FONTS } from '../theme';

export default function AppTextInput({ style, ...props }) {
  return <NativeTextInput {...props} style={[{ fontFamily: FONTS.body }, style]} />;
}
