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
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('warehouse_staff');
  const { login, signUp, forgotPassword } = useStock();
  const { showToast } = useStock();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'login') {
      setLoading(true);
      // login returns a Promise
      login(email, password).then(success => {
        setLoading(false);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Invalid credentials');
          showToast('Login failed: invalid credentials', 'error');
        }
      }).catch(err => {
        setLoading(false);
        setError('Login error');
        showToast('Login error', 'error');
      });
    } else if (mode === 'reset') {
      if (!email) {
        setError('Email is required');
        return;
      }
      setLoading(true);
      forgotPassword(email).then(success => {
        setLoading(false);
        if (success) {
          showToast('If the email exists, a reset link has been sent.', 'success');
          setMode('login');
        } else {
          setError('Failed to send reset link');
        }
      });
    } else {
      // Signup flow: client-side validation
      if (!email || !password) {
        setError('Email and password are required');
        showToast('Email and password are required', 'error');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        showToast('Passwords do not match', 'error');
        return;
      }

      const payload = { email, full_name: name || email.split('@')[0], password, role, is_active: true };
      setLoading(true);
      signUp(payload)
        .then(success => {
          setLoading(false);
          if (success) {
            showToast('Account created and logged in', 'success');
            navigate('/dashboard');
          } else {
            setError('Signup failed');
            showToast('Signup failed', 'error');
          }
        })
        .catch(err => {
          setLoading(false);
          const msg = err?.response?.status === 422 ? 'Validation error: check input' : (err?.message || 'Signup error');
          setError(msg);
          showToast(msg, 'error');
        });
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
              <>
                <NeoInput 
                  label="Name" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                />
                <NeoInput 
                  label="Confirm Password" 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="flex gap-2">
                  <label className="font-bold text-sm uppercase">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="ml-2 px-2">
                    <option value="warehouse_staff">Warehouse Staff</option>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}

            {mode === 'reset' && (
              <div className="text-sm font-bold text-neo-dark mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </div>
            )}

            {error && <div className="bg-neo-accent text-white p-2 font-bold border-2 border-black">{error}</div>}

            <NeoButton type="submit" className="w-full mt-4" variant="primary" disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'ENTER SYSTEM' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD')}
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
