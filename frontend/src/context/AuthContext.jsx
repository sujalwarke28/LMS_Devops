import { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authService } from '../services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);         // MongoDB user object
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const localToken = localStorage.getItem('lms_jwt_token');
      if (localToken) {
        try {
          const { data } = await authService.getMe();
          setUser(data.data);
          setLoading(false);
          return;
        } catch (err) {
          console.error('JWT verification failed, clearing token', err);
          localStorage.removeItem('lms_jwt_token');
        }
      }

      // If no custom token or if it failed, listen to Firebase Auth changes
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const { data } = await authService.getMe();
            setUser(data.data);
          } catch (err) {
            console.error('Failed to fetch Firebase user profile', err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsubscribeFirebase;
    checkAuth().then((unsub) => {
      if (unsub) unsubscribeFirebase = unsub;
    });

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      // Clear local JWT token if any to avoid headers conflict
      localStorage.removeItem('lms_jwt_token');
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      setLoading(true);
      const { data } = await authService.login(email, password);
      localStorage.setItem('lms_jwt_token', data.data.token);
      setUser(data.data.user);
      toast.success('Logged in successfully');
      return data.data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('lms_jwt_token');
      setUser(null);
      setFirebaseUser(null);
      toast.success('Signed out successfully');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await authService.getMe();
      setUser(data.data);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, loginWithGoogle, loginWithEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
