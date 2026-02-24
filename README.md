# Minimal Template

This is a React Native project built with Expo and reusable components.

## Getting Started

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This will start the Expo Dev Server. Open the app in:

- **iOS:** press `i` to launch in the iOS simulator (Mac only)
- **Android:** press `a` to launch in the Android emulator
- **Web:** press `w` to run in a browser

You can also scan the QR code using the Expo Go app on your device. This project fully supports running in Expo Go for quick testing on physical devices.

## Adding Components

You can add more reusable components in the `components/` directory:

- **UI Components:** `components/ui/` - Reusable UI components like Button, Input, Card
- **Feature Components:** `components/storage/` - Feature-specific components
- **Custom Hooks:** `hooks/` - Reusable React hooks for business logic

### Example: Creating a new UI component

```typescript
// components/ui/my-component.tsx
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
}

export function MyComponent({ className }: MyComponentProps) {
  return (
    <View className={cn('p-4', className)}>
      <Text>My Component</Text>
    </View>
  );
}
```

## Project Features

Built with Expo Router  
Styled with Tailwind CSS via Nativewind  
Reusable UI Components  
Expo SecureStore for sensitive data  
AsyncStorage for general app data  
TypeScript with Strict Mode  
Runs on iOS, Android, and Web

## Technology Stack

- **Framework:** React Native Expo (SDK 54)
- **Language:** TypeScript (Strict Mode)
- **Navigation:** Expo Router
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Data Persistence:**
  - Expo SecureStore (for sensitive data)
  - AsyncStorage (for general app data)

## Project Structure

```
TaskInterview/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Home screen
│   ├── secure-store.tsx   # SecureStore demo screen
│   └── async-storage.tsx  # AsyncStorage demo screen
├── components/             # Reusable components
│   ├── ui/                # UI components (Button, Input, Card)
│   └── storage/           # Storage-related components
├── hooks/                 # Custom React hooks
│   ├── use-secure-store.ts
│   └── use-async-storage.ts
├── lib/                   # Utility functions
│   └── utils.ts           # Utility functions (cn helper)
├── assets/                # Images and other assets
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration (strict mode)
├── tailwind.config.js     # NativeWind/Tailwind configuration
└── babel.config.js        # Babel configuration
```

## Authentication & User Management

The app includes a complete authentication system:

### Features Implemented:
-  **Login/Register** - Using `/api/v1/users` endpoints
-  **Auth Token Storage** - Tokens stored securely using Expo SecureStore
-  **Auto-login** - Automatically logs in user on app restart if valid token exists
-  **Logout** - Complete logout functionality
-  **Token Refresh** - Automatic token refresh handling
-  **Profile Screen** - User profile information display
-  **Profile Picture Update** - Update profile picture with image picker
-  **User Statistics** - Display courses enrolled and progress

### API Configuration

1. Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

2. Update `lib/api.ts` with your actual API base URL if needed.

3. See `API_ENDPOINTS.md` for complete API documentation.

### Authentication Flow

- Unauthenticated users are redirected to `/login`
- After successful login/register, users are redirected to `/(tabs)`
- Tokens are automatically stored in SecureStore
- App checks for valid token on startup and auto-logs in if available

## Learn More

To dive deeper into the technologies used:

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

## Deploy with EAS

The easiest way to deploy your app is with Expo Application Services (EAS).

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure

# Build for production
eas build --platform android
eas build --platform ios
```
