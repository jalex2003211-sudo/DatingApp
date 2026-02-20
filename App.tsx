import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/el';

import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import './src/i18n';
import i18n from './src/i18n';

import { usePrefsStore } from './src/state/prefsStore';
import { ChooseDurationScreen } from './src/screens/ChooseDurationScreen';
import { ChooseMoodScreen } from './src/screens/ChooseMoodScreen';
import { ChooseRelationshipStageScreen } from './src/screens/ChooseRelationshipStageScreen';
import { ChooseRolesScreen } from './src/screens/ChooseRolesScreen';
import { EndScreen } from './src/screens/EndScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PremiumScreen } from './src/screens/PremiumScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { useFavoritesStore } from './src/state/favoritesStore';
import { useProfileStore } from './src/state/profileStore';
import { useSessionStore } from './src/state/sessionStore';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const mapToSessionGender = (gender: 'male' | 'female' | 'custom') => {
  if (gender === 'male') return 'MALE' as const;
  if (gender === 'female') return 'FEMALE' as const;
  return 'NEUTRAL' as const;
};

export default function App() {
  const language = usePrefsStore((s) => s.language);
  const profile = useProfileStore((s) => s.profile);
  const hydrateProfile = useProfileStore((s) => s.hydrate);
  const setPartnerProfiles = useSessionStore((s) => s.setPartnerProfiles);
  const migrateLikedBy = useFavoritesStore((s) => s.migrateLegacyLikedBy);

  useEffect(() => {
    void hydrateProfile();
  }, [hydrateProfile]);

  useEffect(() => {
    if (!profile) return;

    setPartnerProfiles({
      partnerA: {
        role: 'A',
        gender: mapToSessionGender(profile.partnerA.gender),
        displayName: profile.partnerA.name
      },
      partnerB: {
        role: 'B',
        gender: mapToSessionGender(profile.partnerB.gender),
        displayName: profile.partnerB.name
      }
    });

    migrateLikedBy(profile);
  }, [migrateLikedBy, profile, setPartnerProfiles]);

  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={DarkTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ChooseRelationshipStage" component={ChooseRelationshipStageScreen} />
            <Stack.Screen name="ChooseRoles" component={ChooseRolesScreen} />
            <Stack.Screen name="ChooseMood" component={ChooseMoodScreen} />
            <Stack.Screen name="ChooseDuration" component={ChooseDurationScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="End" component={EndScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Premium" component={PremiumScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
