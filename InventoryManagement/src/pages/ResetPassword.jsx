import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import NeoCard from '../components/ui/NeoCard';
import NeoInput from '../components/ui/NeoInput';
import NeoButton from '../components/ui/NeoButton';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword, showToast } = useStock();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid token');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const success = await resetPassword(token, password);
      if (success) {
        showToast('Password reset successfully. Please login.', 'success');
        navigate('/auth');
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to reset password';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-neo-dark mb-2 tracking-tighter">STOCK<span className="text-neo-main">MASTER</span></h1>
        </div>

        <NeoCard className="bg-white">
          <h2 className="text-3xl font-black mb-6 uppercase border-b-3 border-black pb-2">
            Set New Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <NeoInput 
              label="New Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
            
            <NeoInput 
              label="Confirm Password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••"
            />

            {error && <div className="bg-neo-accent text-white p-2 font-bold border-2 border-black">{error}</div>}

            <NeoButton type="submit" className="w-full mt-4" variant="primary" disabled={loading || !token}>
              {loading ? 'Resetting...' : 'RESET PASSWORD'}
            </NeoButton>
          </form>

          <div className="mt-6 text-center text-sm font-bold">
            <button onClick={() => navigate('/auth')} className="hover:text-neo-blue underline">Back to Login</button>
          </div>
        </NeoCard>
      </div>
    </div>
  );
};

export default ResetPassword;
