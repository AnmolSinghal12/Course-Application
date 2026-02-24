import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-500',
  primary: 'bg-blue-500',
  secondary: 'bg-gray-300',
  danger: 'bg-red-500',
  success: 'bg-green-500',
};

const sizeStyles = {
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-5',
};

export function Button({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        'rounded-lg active:opacity-80',
        className
      )}
      {...props}
    >
      <Text size="lg" weight="semibold" className="text-white text-center">
        {children}
      </Text>
    </TouchableOpacity>
  );
}
