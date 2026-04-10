import React, { useState } from 'react';
import { 
  clearAuthState, 
  testLoginFlow, 
  checkSessionStatus,
  testRouteAccessibility,
  runAuthTestSuite 
} from '../utils/auth_test';

const AuthTestPage = () => {
  const [email, setEmail] = useState('hisofttechnology2016@gmail.com');
  const [password, setPassword] = useState('1234567890');
  const [testResults, setTestResults] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [activeTest, setActiveTest] = useState('');

  // Function to log messages to the UI
  const log = (message) => {
    setTestResults(prev => prev + message + '\n');
    console.log(message); // Also log to console for debugging
  };

  // Function to clear the results log
  const clearLog = () => {
    setTestResults('');
  };

  // Run the complete test suite
  const handleRunCompleteTest = async () => {
    setIsTesting(true);
    setActiveTest('Complete Test Suite');
    clearLog();
    log('Running complete authentication test suite...');
    log('====================================');

    try {
      // Add event listener to capture console.log
      const originalConsoleLog = console.log;
      let consoleOutput = '';

      console.log = (...args) => {
        const logMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');
        consoleOutput += logMessage + '\n';
        originalConsoleLog.apply(console, args);
      };

      // Step 1: Clear existing auth state
      log('\n[Step 1] Clearing existing authentication state...');
      await clearAuthState();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for reload

      // Step 2: Check initial session status
      log('\n[Step 2] Checking initial session status...');
      const initialSession = await checkSessionStatus();
      log('Initial session data:', JSON.stringify(initialSession, null, 2));

      // Step 3: Test route accessibility before login
      log('\n[Step 3] Testing route accessibility before login...');
      const routesBeforeLogin = await testRouteAccessibility();
      log('Routes before login:', JSON.stringify(routesBeforeLogin, null, 2));

      // Step 4: Perform login
      log('\n[Step 4] Attempting to log in...');
      const loginResult = await testLoginFlow(email, password);
      log('Login result:', JSON.stringify(loginResult, null, 2));

      // Step 5: Check session status after login
      log('\n[Step 5] Checking session status after login...');
      const postLoginSession = await checkSessionStatus();
      log('Session data after login:', JSON.stringify(postLoginSession, null, 2));

      // Step 6: Test route accessibility after login
      log('\n[Step 6] Testing route accessibility after login...');
      const routesAfterLogin = await testRouteAccessibility();
      log('Routes after login:', JSON.stringify(routesAfterLogin, null, 2));

      // Step 7: Check localStorage
      log('\n[Step 7] Checking localStorage...');
      const storedUser = localStorage.getItem('user');
      log('User data in localStorage:', storedUser ? JSON.parse(storedUser) : 'No data');

      // Restore console.log
      console.log = originalConsoleLog;

      // Add captured console output to results
      log('\n[Console Output]\n' + consoleOutput);

      if (loginResult.success === false) {
        log('\nTest failed: Login was unsuccessful');
      } else {
        log('\nTest completed successfully!');
      }
    } catch (error) {
      log('\nTest suite failed:', error.message);
      console.error(error);
    } finally {
      setIsTesting(false);
      setActiveTest('');
    }
  };

  // Run individual tests
  const handleRunIndividualTest = async (testType) => {
    setIsTesting(true);
    setActiveTest(testType);
    clearLog();

    try {
      switch (testType) {
        case 'clearAuth':
          log('Clearing all authentication state...');
          await clearAuthState();
          log('Authentication state cleared.');
          break;
        case 'checkSession':
          log('Checking current session status...');
          const sessionData = await checkSessionStatus();
          log('Session data:', JSON.stringify(sessionData, null, 2));
          break;
        case 'testRoutes':
          log('Testing route accessibility...');
          const routesData = await testRouteAccessibility();
          log('Routes data:', JSON.stringify(routesData, null, 2));
          break;
        case 'testLogin':
          log('Attempting login...');
          const loginResult = await testLoginFlow(email, password);
          log('Login result:', JSON.stringify(loginResult, null, 2));
          break;
      }
    } catch (error) {
      log('Test failed:', error.message);
      console.error(error);
    } finally {
      setIsTesting(false);
      setActiveTest('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Authentication Test Suite</h1>
          <p className="text-gray-600 mt-2">
            This tool helps verify that the authentication system is working correctly.
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTesting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTesting}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <button
              onClick={() => handleRunIndividualTest('clearAuth')}
              disabled={isTesting}
              className={`px-4 py-2 rounded-md transition ${isTesting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              Clear Auth
            </button>
            
            <button
              onClick={() => handleRunIndividualTest('checkSession')}
              disabled={isTesting}
              className={`px-4 py-2 rounded-md transition ${isTesting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Check Session
            </button>
            
            <button
              onClick={() => handleRunIndividualTest('testRoutes')}
              disabled={isTesting}
              className={`px-4 py-2 rounded-md transition ${isTesting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              Test Routes
            </button>
            
            <button
              onClick={() => handleRunIndividualTest('testLogin')}
              disabled={isTesting}
              className={`px-4 py-2 rounded-md transition ${isTesting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            >
              Test Login
            </button>
            
            <button
              onClick={clearLog}
              disabled={isTesting}
              className={`px-4 py-2 rounded-md transition ${isTesting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
            >
              Clear Log
            </button>
          </div>
          
          <button
            onClick={handleRunCompleteTest}
            disabled={isTesting}
            className={`w-full px-6 py-3 rounded-md transition font-bold ${isTesting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isTesting ? 'Running Tests...' : 'Run Complete Test Suite'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-white">Test Results</h2>
            {activeTest && (
              <span className="text-yellow-400 text-sm font-medium">
                Running: {activeTest}
              </span>
            )}
          </div>
          
          <div className="bg-gray-950 text-gray-300 p-4 rounded-md h-80 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
            {testResults || 'Ready to run tests...'}
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>For more detailed debugging, open your browser's developer console.</p>
          <p className="mt-1">You can also use window.AuthTest in the console to access test functions directly.</p>
        </footer>
      </div>
    </div>
  );
};

export default AuthTestPage;