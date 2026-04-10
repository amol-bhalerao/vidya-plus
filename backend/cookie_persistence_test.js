// This script focuses specifically on cookie handling and session persistence
// It will: 1) Log in, 2) Save the cookie, 3) Use the cookie in subsequent requests

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8000';
const CREDENTIALS = {
  email: 'hisofttechnology2016@gmail.com',
  password: '1234567890'
};

// Cookie jar to manually persist cookies between requests
let cookies = '';

// Function to extract cookies from response headers
function extractCookies(response) {
  const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
  let newCookies = '';
  
  setCookieHeaders.forEach(cookie => {
    // Extract just the name=value part of the cookie
    const cookieParts = cookie.split(';');
    if (cookieParts.length > 0) {
      newCookies += cookieParts[0] + '; ';
    }
  });
  
  return newCookies;
}

async function testCookiePersistence() {
  console.log('=== Starting Cookie Persistence Test ===\n');
  
  // Step 1: Login and capture cookie
  console.log('Step 1: Attempting login and capturing cookies...');
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(CREDENTIALS)
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    const loginData = await loginResponse.json();
    console.log('Login response data:', loginData);
    
    // Extract cookies from response
    cookies = extractCookies(loginResponse);
    console.log('Captured cookies:', cookies || 'No cookies set');
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed, aborting test\n');
      return;
    }
  } catch (error) {
    console.error('Login error:', error);
    console.log('❌ Aborting test\n');
    return;
  }
  
  // Step 2: Check session with manually set cookie
  console.log('\nStep 2: Checking session with captured cookie...');
  try {
    const sessionResponse = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': cookies  // Manually set the cookie
      }
    });
    
    console.log(`Session response status: ${sessionResponse.status}`);
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);
    
    if (sessionData.user) {
      console.log('✅ User is authenticated in session! Cookie persistence works manually!');
    } else {
      console.log('❌ No user in session, even with manually set cookie');
      console.log('Possible issues:');
      console.log('- Session cookie is not properly set or recognized by the server');
      console.log('- PHP session configuration issue');
      console.log('- Domain/path mismatch in cookie settings');
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
  
  // Step 3: Check session without cookie (should be unauthenticated)
  console.log('\nStep 3: Checking session without cookie (should be unauthenticated)...');
  try {
    const sessionResponse = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET'
      // No cookie header
    });
    
    console.log(`Session response status: ${sessionResponse.status}`);
    const sessionData = await sessionResponse.json();
    console.log('Session data without cookie:', sessionData);
    
    if (sessionData.user) {
      console.log('⚠️ Warning: User is still authenticated without cookie!');
    } else {
      console.log('✅ Correct: No user in session without cookie');
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
  
  console.log('\n=== Test Completed ===');
  console.log('If manual cookie persistence works but automatic browser persistence doesn\n\'t:');
  console.log('1. Check CORS and SameSite cookie settings');
  console.log('2. Verify browser cookie policies for localhost');
  console.log('3. Check if session_regenerate_id() is being called properly');
}

testCookiePersistence();