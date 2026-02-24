import { View, ViewProps, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/preferences-context';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, style, ...props }: CardProps) {
  const { preferences } = usePreferences();
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;
  const isDark = appliedTheme === 'dark';
  
  return (
    <View
      className={cn(
        'p-4 rounded-lg',
        className
      )}
      style={[
        { backgroundColor: isDark ? '#374151' : '#F3F4F6' },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
