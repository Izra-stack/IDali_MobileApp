import AsyncStorage from '@react-native-async-storage/async-storage';

// Data structure: draft values shared between the editor workflow screens.
export type EditorState = {
  imageUri: string;
  idSize: string;
  paperSize: string;
  bgColor: string;
};

// In-memory draft: screens update this object before persisting it.
export const SharedState: EditorState = {
  imageUri: '',
  idSize: '2x2',
  paperSize: 'A4',
  bgColor: 'White',
};

const STORAGE_KEY = '@idali/editor-state';

// Function: restore the last draft when the app starts.
export async function hydrateSharedState() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    // Conditional: only merge saved data when a draft exists.
    if (stored) Object.assign(SharedState, JSON.parse(stored));
  } catch {
    // A missing draft should not prevent the app from opening.
  }
}

// Function: persist the current draft for the next app launch.
export async function persistSharedState() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SharedState));
  } catch {
    // Draft persistence is best effort; the active in-memory state remains usable.
  }
}

// Function: clear the draft when the user logs out or starts over.
export async function clearSharedState() {
  Object.assign(SharedState, {
    imageUri: '',
    idSize: '2x2',
    paperSize: 'A4',
    bgColor: 'White',
  });
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
}
