// UserContext.tsx
import { use2FA, useUser } from '@/hooks/apiHooks';
import { AuthContextType, Credentials } from '@/types/LocalTypes';
import { UserWithNoPassword } from '@sharedTypes/DBTypes';
import React, { createContext, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const UserContext = createContext<AuthContextType | null>(null);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithNoPassword | null>(null);
  const { postVerify } = use2FA();
  const { getUserByToken } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // login, logout and autologin functions are here instead of components
  const handleLogin = async (credentials: Credentials) => {
    try {
      const loginResult = await postVerify(credentials);
      if (loginResult) {
        localStorage.setItem('token', loginResult.token);
        setUser(loginResult.user);
        navigate('/secret');
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleLogout = useCallback(() => {
    try {
      // remove token from local storage
      localStorage.removeItem('token');
      // set user to null
      setUser(null);
      // navigate to home
      navigate('/');
    } catch (e) {
      console.log((e as Error).message);
    }
  }, [navigate]);

  // handleAutoLogin is used when the app is loaded to check if there is a valid token in local storage
  const handleAutoLogin = async () => {
    try {
      // get token from local storage
      const token = localStorage.getItem('token');
      if (token) {
        // if token exists, get user data from API
        const userResponse = await getUserByToken(token);
        // set user to state
        setUser(userResponse.user);
        // when page is refreshed, the user is redirected to origin (see ProtectedRoute.tsx)
        const origin = location.state.from.pathname || '/';
        navigate(origin);
      }
    } catch (e) {
      console.log((e as Error).message);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, handleLogin, handleLogout, handleAutoLogin }}
    >
      {children}
    </UserContext.Provider>
  );
};
export { UserProvider, UserContext };