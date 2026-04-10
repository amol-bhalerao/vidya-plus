/**
 * Authentication Test Utility
 * 
 * This utility provides functions to test the authentication flow
 * and verify that our session management fixes are working correctly.
 */

// Helper to clear all authentication related data
export const clearAuthState = async () => {
  console.log('[AuthTest] Clearing all authentication state...');
  
  // Clear localStorage
  try {
    localStorage.removeItem('user');
    console.log('[AuthTest] User data removed from localStorage');
  } catch (e) {
    console.error('[AuthTest] Error clearing localStorage:', e);
  }
  
  // Try to logout via API
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
    await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    console.log('[AuthTest] Logout API call completed');
  } catch (e) {
    console.error('[AuthTest] Error calling logout API:', e);
  }
  
  // Force reload to reset application state
  console.log('[AuthTest] Forcing page reload to reset state...');
  window.location.reload();
};

// Function to test login flow
export const testLoginFlow = async (email = 'hisofttechnology2016@gmail.com', password = '1234567890') => {
  console.log('[AuthTest] Starting login flow test...');
  console.log('[AuthTest] Attempting login with email:', email);
  
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
    
    console.log(`[AuthTest] Sending login request to: ${apiBase}/auth/login?debug=1`);
    const response = await fetch(`${apiBase}/auth/login?debug=1`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('[AuthTest] Login response status:', response.status);
    
    // Log cookies for debugging
    const cookieHeader = response.headers.get('set-cookie');
    console.log('[AuthTest] Set-Cookie header:', cookieHeader);
    
    const data = await response.json();
    console.log('[AuthTest] Login response data:', data);
    
    if (response.ok && (data.user || data)) {
      console.log('[AuthTest] Login successful!');
      
      // Check if user data is stored in localStorage
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        console.log('[AuthTest] User data in localStorage after login:', storedUser ? JSON.parse(storedUser) : 'No data');
        
        // Check session status
        checkSessionStatus();
        
        // Attempt to access a protected route
        console.log('[AuthTest] Attempting to access dashboard...');
        window.location.href = '/dashboard';
      }, 1000);
      
      return data;
    } else {
      console.error('[AuthTest] Login failed:', data.error || 'Unknown error');
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    console.error('[AuthTest] Exception during login:', error);
    return { success: false, error: error.message };
  }
};

// Function to check current session status
export const checkSessionStatus = async () => {
  console.log('[AuthTest] Checking current session status...');
  
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
    const response = await fetch(`${apiBase}/auth/session?debug=1`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('[AuthTest] Session check response status:', response.status);
    
    const data = await response.json();
    console.log('[AuthTest] Session data:', data);
    
    // Check if user data is available in UserContext
    try {
      const { useUser } = await import('@/contexts/UserContext');
      const userHook = useUser;
      console.log('[AuthTest] useUser hook imported successfully');
    } catch (e) {
      console.log('[AuthTest] UserContext is not available in this context');
    }
    
    return data;
  } catch (error) {
    console.error('[AuthTest] Error checking session:', error);
    return { error: error.message };
  }
};

// Function to test route accessibility
export const testRouteAccessibility = async (routes = [
  '/',
  '/web/about',
  '/dashboard',
  '/dashboard/login'
]) => {
  console.log('[AuthTest] Testing route accessibility...');
  
  const results = {};
  
  for (const route of routes) {
    console.log(`[AuthTest] Testing access to: ${route}`);
    
    try {
      // This is a simplified check - in a real app you would navigate to the route
      // and check if authentication is required
      
      // For public routes, we just check if they exist
      if (route.startsWith('/web') || route === '/') {
        results[route] = { accessible: true, type: 'public' };
        console.log(`[AuthTest] Route ${route} is public and accessible`);
      } else {
        // For protected routes, we check if user is authenticated
        const sessionData = await checkSessionStatus();
        const isAuthenticated = sessionData.user !== undefined;
        
        results[route] = {
          accessible: isAuthenticated,
          type: 'protected',
          requiresAuth: true
        };
        
        console.log(`[AuthTest] Route ${route} is ${isAuthenticated ? 'accessible' : 'requires authentication'}`);
      }
    } catch (error) {
      console.error(`[AuthTest] Error testing route ${route}:`, error);
      results[route] = { accessible: false, error: error.message };
    }
  }
  
  console.log('[AuthTest] Route accessibility test results:', results);
  return results;
};

// Run complete authentication test suite
export const runAuthTestSuite = async () => {
  console.log('[AuthTest] Running complete authentication test suite...');
  
  try {
    console.log('==========================');
    console.log('    AUTHENTICATION TESTS   ');
    console.log('==========================');
    
    // Step 1: Clear all existing auth state
    console.log('\n[Step 1] Clearing existing authentication state...');
    // await clearAuthState(); // Uncomment to fully reset state
    
    // Step 2: Check initial session status
    console.log('\n[Step 2] Checking initial session status...');
    await checkSessionStatus();
    
    // Step 3: Test route accessibility before login
    console.log('\n[Step 3] Testing route accessibility before login...');
    await testRouteAccessibility();
    
    // Step 4: Perform login
    console.log('\n[Step 4] Attempting to log in...');
    const loginResult = await testLoginFlow();
    
    if (loginResult.success === false) {
      console.error('\n[AuthTest] Test failed: Login was unsuccessful');
      return { success: false, error: 'Login failed' };
    }
    
    console.log('\n[AuthTest] Test completed successfully!');
    console.log('==========================');
    
    return { success: true };
  } catch (error) {
    console.error('\n[AuthTest] Test suite failed:', error);
    console.log('==========================');
    return { success: false, error: error.message };
  }
};

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined') {
  // Add test functions to window for easy access in browser console
  window.AuthTest = {
    clearAuthState,
    testLoginFlow,
    checkSessionStatus,
    testRouteAccessibility,
    runAuthTestSuite
  };
  
  console.log('[AuthTest] Authentication test utilities are available in window.AuthTest');
  console.log('Run window.AuthTest.runAuthTestSuite() to test the authentication flow');
}