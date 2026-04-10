import React, { createContext, useState, useEffect, useContext } from 'react';

// Define the shape of our context value
export const UserContext = createContext({
  user: null,
  isSuperAdmin: false,
  instituteId: null,
  loading: true,
  setInstituteId: (id) => { },
  handleLoginSuccess: (userData) => { },
  handleLogout: () => { },
  setLoading: (isLoading) => { }
});

// UserProvider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [instituteId, setInstituteId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from session or local storage
  const fetchUserData = async () => {
    console.log('[UserContext] fetchUserData called');
    try {
      setLoading(true);

      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      // Make sure to include credentials to send cookies
      const res = await fetch(`${apiBase}/auth/session?debug=1`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('[UserContext] Session fetch response status:', res.status);

      // Log all response headers for debugging
      const headers = {};
      for (const pair of res.headers.entries()) {
        headers[pair[0]] = pair[1];
      }
      console.log('[UserContext] Session fetch response headers:', headers);

      const data = await res.json();
      console.log('[UserContext] Session data received:', data);

      if (data.user) {
        // We have valid user data from the API
        console.log('[UserContext] Valid user data received from API:', data.user);

        setUser(data.user);
        setIsSuperAdmin(data.user.role === 'super_admin');
        setInstituteId(data.user.institute_id || null);

        // Update localStorage with fresh data
        try {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('[UserContext] User data updated in localStorage from API');
        } catch (e) {
          console.error('[UserContext] Error saving to localStorage:', e);
        }

        setLoading(false);
        return true;
      } else {
        console.log('[UserContext] No user data in session response, checking localStorage...');

        // Try to use localStorage as fallback if API doesn't return user data
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log('[UserContext] Using fallback user data from localStorage:', parsedUser);

            setUser(parsedUser);
            setIsSuperAdmin(parsedUser.role === 'super_admin');
            setInstituteId(parsedUser.institute_id || null);
            setLoading(false);
            return true;
          } else {
            console.log('[UserContext] No user data in localStorage either');
          }
        } catch (e) {
          console.error('[UserContext] Error reading from localStorage:', e);
        }

        // Only clear state if we have no fallback data
        setUser(null);
        setIsSuperAdmin(false);
        setInstituteId(null);
        setLoading(false);

        return false;
      }
    } catch (error) {
      console.error('[UserContext] Error fetching user data:', error);

      // In case of network error, try to use localStorage as fallback
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('[UserContext] Using offline user data from localStorage:', parsedUser);

          setUser(parsedUser);
          setIsSuperAdmin(parsedUser.role === 'super_admin');
          setInstituteId(parsedUser.institute_id || null);
        }
      } catch (e) {
        console.error('[UserContext] Error reading from localStorage during fallback:', e);
      }

      setLoading(false);
      return false;
    }
  };

  // Handle login success
  const handleLoginSuccess = (userData) => {
    console.log('[UserContext] handleLoginSuccess called with:', userData);

    try {
      // Parse if userData is a string
      const parsedUserData = typeof userData === 'string' ? JSON.parse(userData) : userData;

      console.log('[UserContext] Parsed user data:', parsedUserData);

      // Update state immediately
      setUser(parsedUserData);
      setIsSuperAdmin(parsedUserData.role === 'super_admin');
      setInstituteId(parsedUserData.institute_id || null);
      setLoading(false);

      // Store in localStorage for persistence
      try {
        localStorage.setItem('user', JSON.stringify(parsedUserData));
        console.log('[UserContext] User data saved to localStorage');
      } catch (storageError) {
        console.error('[UserContext] Error saving to localStorage:', storageError);
      }

      // Force re-fetch session after a short delay to ensure consistency
      setTimeout(() => {
        console.log('[UserContext] Re-fetching user data after login');
        fetchUserData();
      }, 100);

    } catch (error) {
      console.error('[UserContext] Error processing login success:', error);
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    console.log('[UserContext] handleLogout called');

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      console.log('[UserContext] Logout response status:', res.status);

      // Clear local state
      setUser(null);
      setIsSuperAdmin(false);
      setInstituteId(null);

      // Clear localStorage
      try {
        localStorage.removeItem('user');
        console.log('[UserContext] User removed from localStorage');
      } catch (e) {
        console.error('[UserContext] Error removing user from localStorage:', e);
      }

      // Redirect to login after logout
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('[UserContext] Error during logout:', error);
      // Even if API call fails, clear local state as fallback
      setUser(null);
      setIsSuperAdmin(false);
      setInstituteId(null);
      try {
        localStorage.removeItem('user');
      } catch (e) {
        console.error('[UserContext] Error removing user from localStorage:', e);
      }
      window.location.href = '/admin/login';
    }
  };

  // Set institute for super admin
  const handleSetInstituteId = (id) => {
    console.log('[UserContext] Setting institute ID:', id);
    setInstituteId(id);
  };

  // Select institute (alias for setInstituteId for super admin)
  const selectInstitute = (id) => {
    console.log('[UserContext] Selecting institute:', id);
    handleSetInstituteId(id);
  };

  // Initial data fetch
  useEffect(() => {
    console.log('[UserContext] Initial data fetch');
    fetchUserData();
  }, []);

  const contextValue = {
    user,
    isSuperAdmin,
    instituteId,
    loading,
    setInstituteId: handleSetInstituteId,
    selectInstitute,
    handleLoginSuccess,
    handleLogout,
    setLoading,
    fetchUserData
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Named export for useUser hook
export { useUser };

// Default export for UserProvider for backward compatibility
export default UserProvider;
