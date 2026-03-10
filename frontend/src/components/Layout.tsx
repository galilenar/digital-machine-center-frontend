import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  InputBase,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ContentCategory } from '../types';

export type CategoryTab = ContentCategory | 'ALL';

export default function Layout() {
  const { user, isAuthenticated, isAdmin, isDealer, isVendor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('ALL');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#151a2a' }}>
      {/* ==================== HEADER ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {/* Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Logo */}
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
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
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#F5F5F5', whiteSpace: 'nowrap' }}>
              Component library
            </Typography>
          </Box>

          {/* CNC / Robot tabs */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'CNC', value: ContentCategory.CNC_MACHINES },
              { label: 'Robot', value: ContentCategory.ROBOTS },
            ].map((tab) => (
              <Box
                key={tab.value}
                onClick={() => setActiveCategory(
                  activeCategory === tab.value ? 'ALL' : tab.value
                )}
                sx={{
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: activeCategory === tab.value ? '#fff' : 'rgba(255,255,255,0.6)',
                  bgcolor: activeCategory === tab.value ? '#1269D9' : 'transparent',
                  borderRadius: activeCategory === tab.value ? '6px' : 0,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                  '&:hover': {
                    color: '#fff',
                  },
                }}
              >
                {tab.label}
              </Box>
            ))}
          </Box>

          {/* Search bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: 360,
              height: 30,
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <SearchIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', ml: 1 }} />
            <InputBase
              placeholder="Search"
              sx={{
                flex: 1,
                px: 1,
                color: '#F5F5F5',
                fontSize: '0.85rem',
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255,255,255,0.4)',
                  opacity: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAuthenticated ? (
            <>
              {(isDealer || isVendor || isAdmin) && (
                <Button
                  size="small"
                  onClick={() => navigate('/dealer')}
                  sx={{
                    color: location.pathname === '/dealer' ? '#00CB9A' : 'rgba(255,255,255,0.55)',
                    fontSize: '0.8rem',
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
                    color: location.pathname === '/admin' ? '#00CB9A' : 'rgba(255,255,255,0.55)',
                    fontSize: '0.8rem',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  Admin
                </Button>
              )}
              <Typography sx={{ fontSize: '0.8rem', color: '#F5F5F5', fontWeight: 500 }}>
                {user?.username}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.8rem',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                onClick={() => navigate('/login')}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: '#00CB9A',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  px: 2,
                  '&:hover': { bgcolor: '#00b588' },
                }}
              >
                Log in
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ==================== PAGE CONTENT ==================== */}
      <Box component="main" sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet context={{ activeCategory, setActiveCategory }} />
      </Box>

      {/* ==================== STATUS BAR ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          height: 24,
          flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
          Ready
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#00CB9A' }} />
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
            v1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
