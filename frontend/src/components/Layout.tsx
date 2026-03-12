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
      {/* ==================== HEADER (Figma node 3:4) ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          py: '12px',
          bgcolor: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {/* Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Logo + title */}
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Box component="img" src="/logo.svg" alt="Logo" sx={{ width: 28, height: 28 }} />
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#f5f5f5',
                whiteSpace: 'nowrap',
              }}
            >
              Component library
            </Typography>
          </Box>

          {/* CNC / Robot pill tabs */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.08)',
              borderRadius: '64px',
              p: '2px',
            }}
          >
            {[
              { label: 'CNC', value: ContentCategory.CNC_MACHINES },
              { label: 'Robot', value: ContentCategory.ROBOTS },
            ].map((tab) => {
              const isActive = activeCategory === tab.value;
              return (
                <Box
                  key={tab.value}
                  onClick={() => setActiveCategory(isActive ? 'ALL' : tab.value)}
                  sx={{
                    px: isActive ? '17px' : '16px',
                    py: isActive ? '3px' : '2px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                    bgcolor: isActive ? '#46acff' : 'transparent',
                    border: isActive ? '1px solid rgba(25,28,36,0.08)' : '1px solid transparent',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '24px',
                      color: isActive ? '#191c24' : 'rgba(255,255,255,0.6)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Search bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: 360,
              height: 30,
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
            }}
          >
            <SearchIcon sx={{ fontSize: 16, color: 'rgba(245,245,245,0.4)', ml: '8px' }} />
            <InputBase
              placeholder="Search"
              sx={{
                flex: 1,
                ml: '8px',
                color: '#f5f5f5',
                fontFamily: '"Inter", sans-serif',
                fontSize: '12.8px',
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(245,245,245,0.4)',
                  opacity: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isAuthenticated ? (
            <>
              {(isDealer || isVendor || isAdmin) && (
                <Box
                  onClick={() => navigate('/dealer')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 37,
                    px: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', lineHeight: '21px', color: '#fff', whiteSpace: 'nowrap' }}>
                    Dealer
                  </Typography>
                </Box>
              )}
              {isAdmin && (
                <Box
                  onClick={() => navigate('/admin')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 37,
                    px: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: '12px', lineHeight: '21px', color: '#fff', whiteSpace: 'nowrap' }}>
                    Admin
                  </Typography>
                </Box>
              )}
              <Box
                onClick={() => navigate('/')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 37,
                  px: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '12px', lineHeight: '21px', color: '#fff', whiteSpace: 'nowrap' }}>
                  {user?.username}
                </Typography>
              </Box>
              <Box
                onClick={handleLogout}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 37,
                  px: '16px',
                  borderRadius: '48px',
                  bgcolor: '#46acff',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#3d9be6' },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '12px', lineHeight: '21px', color: '#191c24', whiteSpace: 'nowrap' }}>
                  Logout
                </Typography>
              </Box>
            </>
          ) : (
            <>
              {/* Sign In — text button */}
              <Box
                onClick={() => navigate('/login')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 37,
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '21px',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}
                >
                  Sign In
                </Typography>
              </Box>
              {/* Log in — filled pill */}
              <Box
                onClick={() => navigate('/login')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 37,
                  width: 71.48,
                  borderRadius: '48px',
                  bgcolor: '#46acff',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#3d9be6' },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '21px',
                    color: '#191c24',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}
                >
                  Log in
                </Typography>
              </Box>
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
