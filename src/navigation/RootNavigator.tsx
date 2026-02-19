import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChooseDurationScreen } from '../screens/ChooseDurationScreen';
import { ChooseMoodScreen } from '../screens/ChooseMoodScreen';
import { EndScreen } from '../screens/EndScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { GameScreen } from '../screens/GameScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SplashScreen } from '../screens/SplashScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F1115' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ChooseMood" component={ChooseMoodScreen} />
      <Stack.Screen name="ChooseDuration" component={ChooseDurationScreen} />
      <Stack.Screen name="Game" component={GameScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="End" component={EndScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
