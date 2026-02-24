import { TextInput, TextInputProps, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';
import { usePreferences } from '@/contexts/preferences-context';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const { preferences } = usePreferences();
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;
  const isDark = appliedTheme === 'dark';
  
  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text variant="label" className="mb-2">{label}</Text>
      )}
      <TextInput
        className={cn(
          isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900',
          'border rounded-lg px-4 py-3',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
        style={isDark ? { color: '#fff' } : { color: '#111827' }}
        {...props}
      />
      {error && (
        <Text variant="caption" color="error" className="mt-1">{error}</Text>
      )}
    </View>
  );
}
