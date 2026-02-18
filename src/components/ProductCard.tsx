import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Memory as MemoryIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import type { Product } from '../types';
import {
  contentTypeLabels,
  contentTypeColors,
  machineTypeLabels,
} from '../types';

interface ProductCardProps {
  product: Product;
}

const placeholderImage =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" fill="#e8eaf6">
    <rect width="400" height="240"/>
    <text x="200" y="120" text-anchor="middle" dominant-baseline="middle"
          font-family="Inter,sans-serif" font-size="40" fill="#9fa8da">CNC</text>
  </svg>`);

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={product.imageUrl || placeholderImage}
          alt={product.name}
          sx={{ objectFit: 'cover', bgcolor: '#e8eaf6' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = placeholderImage;
          }}
        />
        {/* Content type badge */}
        <Chip
          label={contentTypeLabels[product.contentType]}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: contentTypeColors[product.contentType],
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
        {/* Price badge */}
        {product.priceEur !== undefined && product.priceEur !== null && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: product.priceEur === 0 ? '#4caf50' : 'primary.main',
              color: '#fff',
              px: 1.5,
              py: 0.4,
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            {product.priceEur === 0 ? 'Free' : `€${product.priceEur}`}
          </Box>
        )}
      </Box>

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        {/* Title */}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </Typography>

        {/* Metadata chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {product.machineManufacturer && (
            <Chip
              icon={<BuildIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={product.machineManufacturer}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.72rem', height: 24 }}
            />
          )}
          {product.machineType && (
            <Chip
              icon={<SettingsIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={machineTypeLabels[product.machineType]}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.72rem', height: 24 }}
            />
          )}
          {product.numberOfAxes > 0 && (
            <Chip
              icon={<MemoryIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={`${product.numberOfAxes} axes`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.72rem', height: 24 }}
            />
          )}
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Footer: author + downloads */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '60%' }}>
            {product.authorName || product.productOwner || 'Unknown'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DownloadIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {product.downloadCount ?? 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
