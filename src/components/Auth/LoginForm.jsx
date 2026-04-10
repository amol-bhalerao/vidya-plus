import React, { useState } from 'react';
// import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LogIn } from 'lucide-react';

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // PHP/MySQL login logic
  const { toast } = useToast();
  const { handleLoginSuccess } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/auth/login?debug=1`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[LoginForm] Login response status:', response.status);
      console.log('[LoginForm] Response headers:', response.headers.get('set-cookie'));

      const data = await response.json();
      console.log('[LoginForm] Login response data:', data);

      if (response.ok && (data.user || data)) {
        // Handle successful login using UserContext
        const respUser = data.user ?? data;
        console.log('[LoginForm] User data from server:', respUser);

        // Use handleLoginSuccess from UserContext to manage user state
        handleLoginSuccess(respUser);

        // Delay to ensure UI updates
        setTimeout(() => {
          if (onLoginSuccess) {
            console.log('[LoginForm] Calling onLoginSuccess callback');
            onLoginSuccess(respUser);
          }
        }, 300);

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
      } else {
        console.error('[LoginForm] Login failed:', data.error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: data.error || 'Invalid email or password',
        });
      }
    } catch (error) {
      console.error('[LoginForm] Exception during login:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An error occurred during login. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Dashboard Login</h2>
        <p className="text-gray-500">Access your institute's management panel.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <Button disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
          {loading ? 'Logging in...' : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Login
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;