declare module 'expo-image-picker' {
  export type PermissionResponse = { granted: boolean };
  export type ImagePickerResult = { canceled: boolean; assets: Array<{ uri: string }> };
  export function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>;
  export function launchImageLibraryAsync(options?: Record<string, unknown>): Promise<ImagePickerResult>;
}
