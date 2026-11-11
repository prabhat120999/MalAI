import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ChatProvider } from './src/context/ChatContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ChatProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ChatProvider>
    </SafeAreaProvider>
  );
}
