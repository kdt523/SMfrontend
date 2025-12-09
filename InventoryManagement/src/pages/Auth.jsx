import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import NeoCard from '../components/ui/NeoCard';
import NeoInput from '../components/ui/NeoInput';
import NeoButton from '../components/ui/NeoButton';

const Auth = () => {
  const [mode, setMode] = useState('login'); // login, signup, reset
  const [email, setEmail] = useState('admin@stockmaster.com');
  const [password, setPassword] = useState('password');
  const { login } = useStock();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      if (login(email, password)) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } else {
      // Simulate signup/reset
      setMode('login');
      setError('');
      alert('Action simulated successfully! Please login.');
    }
  };

  return (
    <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-neo-dark mb-2 tracking-tighter">STOCK<span className="text-neo-main">MASTER</span></h1>
          <p className="font-bold text-xl">Inventory Management System</p>
        </div>

        <NeoCard className="bg-white">
          <h2 className="text-3xl font-black mb-6 uppercase border-b-3 border-black pb-2">
            {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <NeoInput 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@company.com"
            />
            
            {mode !== 'reset' && (
              <NeoInput 
                label="Password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            )}

            {mode === 'signup' && (
              <NeoInput 
                label="Confirm Password" 
                type="password" 
                placeholder="••••••••"
              />
            )}

            {mode === 'reset' && (
              <NeoInput 
                label="OTP Code" 
                placeholder="123456"
              />
            )}

            {error && <div className="bg-neo-accent text-white p-2 font-bold border-2 border-black">{error}</div>}

            <NeoButton type="submit" className="w-full mt-4" variant="primary">
              {mode === 'login' ? 'ENTER SYSTEM' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
            </NeoButton>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm font-bold">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('signup')} className="hover:text-neo-blue underline">Create an account</button>
                <button onClick={() => setMode('reset')} className="hover:text-neo-accent underline">Forgot password?</button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => setMode('login')} className="hover:text-neo-blue underline">Back to Login</button>
            )}
          </div>
        </NeoCard>
      </div>
    </div>
  );
};

export default Auth;
