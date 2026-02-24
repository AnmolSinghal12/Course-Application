import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/preferences-context';

interface TextProps extends RNTextProps {
  variant?: 'default' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'error' | 'success';
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  default: '',
  heading: 'font-bold',
  subheading: 'font-semibold',
  body: '',
  caption: 'text-sm',
  label: 'font-semibold',
};

const sizeStyles = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

const weightStyles = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const getColorStyles = (isDark: boolean) => ({
  default: isDark ? 'text-white' : 'text-gray-900',
  primary: isDark ? 'text-blue-400' : 'text-blue-600',
  secondary: isDark ? 'text-white' : 'text-gray-600',
  muted: isDark ? 'text-white' : 'text-gray-500',
  error: isDark ? 'text-red-400' : 'text-red-500',
  success: isDark ? 'text-green-400' : 'text-green-500',
});

export function Text({
  variant = 'default',
  size = 'md',
  weight,
  color = 'default',
  className,
  children,
  ...props
}: TextProps) {
  const { preferences } = usePreferences();
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;
  const isDark = appliedTheme === 'dark';
  
  const finalWeight = weight || (variant === 'heading' || variant === 'subheading' ? 'bold' : variant === 'label' ? 'semibold' : 'normal');

  const colorStyles = getColorStyles(isDark);

  return (
    <RNText
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        weightStyles[finalWeight],
        colorStyles[color],
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}
