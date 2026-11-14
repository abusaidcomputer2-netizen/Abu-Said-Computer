import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const SHOP_OWNER_EMAIL = 'abusaidcomputer2@gmail.com';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testFirestoreConnection();

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let pendingAutoAuth: Promise<AutoSyncSessionStatus> | null = null;

export type AutoSyncSessionStatus = 'connected' | 'needs-anonymous-enable' | 'error';

// Initialize auth state listener. Preserves Firebase session across page reloads.
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || '');
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const ensureAutoCloudSession = async (): Promise<AutoSyncSessionStatus> => {
  if (auth.currentUser) {
    cachedUser = auth.currentUser;
    return 'connected';
  }
  if (pendingAutoAuth) return pendingAutoAuth;

  pendingAutoAuth = (async () => {
    try {
      isSigningIn = true;
      const cred = await signInAnonymously(auth);
      cachedUser = cred.user;
      void testFirestoreConnection();
      return 'connected' as AutoSyncSessionStatus;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed') {
        return 'needs-anonymous-enable' as AutoSyncSessionStatus;
      }
      console.warn('Auto cloud session check warning:', code || error?.message);
      return 'error' as AutoSyncSessionStatus;
    } finally {
      isSigningIn = false;
      pendingAutoAuth = null;
    }
  })();

  return pendingAutoAuth;
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || '';
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error?.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
      throw new Error(
        `ডোমেইন অনুমোদিত নয় (${window.location.hostname})। Firebase Console -> Authentication -> Settings -> Authorized domains-এ এই ডোমেইনটি যোগ করুন।`
      );
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedGoogleUser = (): User | null => {
  return cachedUser;
};

export const googleLogout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    cachedAccessToken = null;
    cachedUser = null;
  }
};
