import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Avatar,
  InputBase,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, isAuthenticated, isAdmin, isDealer, isVendor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#191C24' }}>
      {/* ==================== HEADER ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 1,
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          height: 46,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            mr: 1,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #00CB9A 0%, #1269D9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>C</Typography>
          </Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              color: '#F5F5F5',
              whiteSpace: 'nowrap',
            }}
          >
            Projects
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Search bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: 200,
            height: 30,
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: 'rgba(245,245,245,0.35)', ml: 1 }} />
          <InputBase
            placeholder="Search"
            sx={{
              flex: 1,
              px: 1,
              color: '#F5F5F5',
              fontSize: '0.8rem',
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(245,245,245,0.4)',
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* User area */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, gap: 0.8 }}>
          {isAuthenticated ? (
            <>
              {/* Role-based navigation buttons */}
              {(isDealer || isVendor || isAdmin) && (
                <Button
                  size="small"
                  onClick={() => navigate('/dealer')}
                  sx={{
                    color: location.pathname === '/dealer' ? '#00CB9A' : 'rgba(245,245,245,0.55)',
                    fontSize: '0.73rem',
                    px: 1.2,
                    minHeight: 28,
                    bgcolor: location.pathname === '/dealer' ? 'rgba(0,203,154,0.1)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  Dealer
                </Button>
              )}
              {isAdmin && (
                <Button
                  size="small"
                  onClick={() => navigate('/admin')}
                  sx={{
                    color: location.pathname === '/admin' ? '#00CB9A' : 'rgba(245,245,245,0.55)',
                    fontSize: '0.73rem',
                    px: 1.2,
                    minHeight: 28,
                    bgcolor: location.pathname === '/admin' ? 'rgba(0,203,154,0.1)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  Admin
                </Button>
              )}

              {/* User badge + logout */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  px: 1,
                  py: 0.4,
                }}
              >
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    background: 'linear-gradient(135deg, #00CB9A, #1269D9)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#F5F5F5' }}>
                  {user?.username}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'rgba(245,245,245,0.6)',
                  fontSize: '0.7rem',
                  px: 1.2,
                  py: 0.3,
                  minHeight: 26,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.25)' },
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              size="small"
              sx={{
                bgcolor: '#1269D9',
                fontSize: '0.75rem',
                px: 2,
                minHeight: 28,
                '&:hover': { bgcolor: '#0d4a97' },
              }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Box>

      {/* ==================== PAGE CONTENT ==================== */}
      <Box component="main" sx={{ flex: 1, bgcolor: '#191C24', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>

      {/* ==================== STATUS BAR ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          height: 22,
          flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(245,245,245,0.35)' }}>
          Ready
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#00CB9A' }} />
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(245,245,245,0.35)' }}>
            v1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
