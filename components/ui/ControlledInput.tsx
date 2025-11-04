import React, { forwardRef } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Input from './Input';
import { TextInputProps, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ControlledInputProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outline' | 'filled';
  rules?: any;
}

function ControlledInputInner<T extends FieldValues>({
  control,
  name,
  rules,
  ...inputProps
}: ControlledInputProps<T>, ref: React.ForwardedRef<TextInput>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          ref={ref}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...inputProps}
        />
      )}
    />
  );
}

// Cast to maintain generic type while using forwardRef
const ControlledInput = forwardRef(ControlledInputInner) as <T extends FieldValues>(
  props: ControlledInputProps<T> & { ref?: React.ForwardedRef<TextInput> }
) => ReturnType<typeof ControlledInputInner>;

export default ControlledInput;
