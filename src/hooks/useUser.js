import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

/**
 * Hook to access the user context
 * @returns {Object} User context values
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};