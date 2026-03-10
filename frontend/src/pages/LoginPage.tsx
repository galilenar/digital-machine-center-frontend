import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#151a2a',
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          bgcolor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          p: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Logo + Title */}
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '48px',
              background: 'linear-gradient(135deg, #191c24 0%, #1f2e3f 12.5%, #24405b 25%, #2a5276 37.5%, #306492 50%, #3b88c8 75%, #46acff 100%)',
            }}
          />
          <Box>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '28px',
                color: '#fff',
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.5)',
                mt: '4px',
              }}
            >
              Sign in to Component library
            </Typography>
          </Box>
        </Box>

        {/* Error */}
        {error && (
          <Alert
            severity="error"
            sx={{
              bgcolor: 'rgba(255,80,80,0.1)',
              color: '#ff6b6b',
              border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: '8px',
              '& .MuiAlert-icon': { color: '#ff6b6b' },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username field */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: 40,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              px: '12px',
              gap: '8px',
              '&:focus-within': { borderColor: '#46acff' },
            }}
          >
            <PersonIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} />
            <InputBase
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              sx={{
                flex: 1,
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                color: '#fff',
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(245,245,245,0.4)',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Password field */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: 40,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              px: '12px',
              gap: '8px',
              '&:focus-within': { borderColor: '#46acff' },
            }}
          >
            <LockIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} />
            <InputBase
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              sx={{
                flex: 1,
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                color: '#fff',
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(245,245,245,0.4)',
                  opacity: 1,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={() => setShowPassword(!showPassword)}
              sx={{ color: 'rgba(255,255,255,0.35)', p: '4px' }}
            >
              {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>

          {/* Sign In button */}
          <Box
            component="button"
            type="submit"
            disabled={loading}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              borderRadius: '48px',
              bgcolor: '#46acff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s',
              '&:hover': { bgcolor: '#3d9be6' },
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#191c24',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Typography>
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

        {/* Browse without sign in */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover p': { color: 'rgba(255,255,255,0.7)' },
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
              color: 'rgba(255,255,255,0.5)',
              transition: 'color 0.15s',
            }}
          >
            Browse Library without signing in
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
