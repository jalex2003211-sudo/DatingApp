# Between Us (Expo React Native MVP)

## Assumptions
- MVP is offline-only and ships with local decks.
- No user accounts or cloud sync.
- Session timer is authoritative and ends game automatically.

## Create project (fresh)
```bash
npx create-expo-app@latest between-us --template expo-template-blank-typescript
cd between-us
```

## Install dependencies
```bash
npm install @react-navigation/native @react-navigation/native-stack zustand @react-native-async-storage/async-storage i18next react-i18next expo-localization react-native-safe-area-context react-native-screens react-native-gesture-handler
```

## Run app
```bash
npm run start
```

### Android emulator/device
```bash
npm run android
```

### iOS simulator/device (macOS)
```bash
npm run ios
```

## EAS build (store-ready artifacts)
```bash
npm install -g eas-cli
expo login
# inside app folder:
eas build:configure
eas build -p android --profile production # AAB
eas build -p ios --profile production
```

## Release checklist (basic)
- Configure app icon, adaptive icon, splash image in `app.json`.
- Update version/build numbers before each submission.
- Verify localized screenshots (EN + EL).
- Test on small + large phones, iOS + Android.
- Validate session/timer/favorites persistence in production build.
- Ensure content moderation for intimate deck stays non-explicit.
