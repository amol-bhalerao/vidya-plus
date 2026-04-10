// This script tests the authentication flow and API communication
// Run it in your browser console or with Node.js

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8000';
const CREDENTIALS = {
  email: 'hisofttechnology2016@gmail.com',
  password: '1234567890'
};

async function runTests() {
  console.log('=== Starting API Authentication Tests ===\n');

  // Test 1: Login attempt
  console.log('Test 1: Attempting to login...');
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify(CREDENTIALS)
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    const loginData = await loginResponse.json();
    console.log('Login response data:', loginData);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful!\n');
    } else {
      console.log('❌ Login failed\n');
      
      // If login fails, try to diagnose the issue
      if (loginResponse.status === 401) {
        console.log('Possible issues:');
        console.log('- Incorrect credentials');
        console.log('- Password hashing issue');
        console.log('- Session storage problem');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    console.log('Possible CORS or network issue\n');
  }

  // Test 2: Check session after login attempt
  console.log('Test 2: Checking session status...');
  try {
    const sessionResponse = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Access-Control-Allow-Credentials': 'true'
      }
    });
    
    console.log(`Session response status: ${sessionResponse.status}`);
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);
    
    if (sessionData.user) {
      console.log('✅ User is authenticated in session!\n');
    } else {
      console.log('❌ No user in session\n');
    }
  } catch (error) {
    console.error('Session check error:', error);
  }

  // Test 3: Try to access protected resource
  console.log('Test 3: Attempting to access protected resource (institutes)...');
  try {
    const institutesResponse = await fetch(`${API_BASE}/institutes`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log(`Institutes response status: ${institutesResponse.status}`);
    const institutesData = await institutesResponse.json();
    console.log('Institutes data count:', Array.isArray(institutesData) ? institutesData.length : 'Not an array');
  } catch (error) {
    console.error('Institutes fetch error:', error);
  }

  console.log('\n=== Tests Completed ===');
  console.log('If you see 401 errors or null user data, check:');
  console.log('1. CORS settings in the backend');
  console.log('2. Session cookie domain/path configuration');
  console.log('3. Password hashing implementation');
  console.log('4. Database user records');
}

// Run the tests
runTests();

// For browser environment (commented for Node.js)
// document.addEventListener('DOMContentLoaded', runTests);