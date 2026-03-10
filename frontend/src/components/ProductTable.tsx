import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import type { Product } from '../types';
import {
  contentTypeLabels,
  contentTypeColors,
  machineTypeLabels,
} from '../types';

interface ProductTableProps {
  products: Product[];
}

const placeholderImage =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#e8eaf6">
    <rect width="60" height="60" rx="8"/>
    <text x="30" y="30" text-anchor="middle" dominant-baseline="middle"
          font-family="Inter,sans-serif" font-size="14" fill="#9fa8da">CNC</text>
  </svg>`);

export default function ProductTable({ products }: ProductTableProps) {
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              '& th': {
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid',
                borderColor: 'divider',
                py: 1.5,
              },
            }}
          >
            <TableCell>Product</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Manufacturer</TableCell>
            <TableCell>Machine Type</TableCell>
            <TableCell align="center">Axes</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="center">Downloads</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              hover
              sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {/* Product name + image */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    variant="rounded"
                    src={product.imageUrl || placeholderImage}
                    sx={{ width: 44, height: 44, bgcolor: '#e8eaf6' }}
                    imgProps={{
                      onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = placeholderImage;
                      },
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {product.authorName || product.productOwner}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              {/* Content type */}
              <TableCell>
                <Chip
                  label={contentTypeLabels[product.contentType]}
                  size="small"
                  sx={{
                    bgcolor: contentTypeColors[product.contentType] + '18',
                    color: contentTypeColors[product.contentType],
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
              </TableCell>

              {/* Manufacturer */}
              <TableCell>
                <Typography variant="body2">{product.machineManufacturer || '—'}</Typography>
              </TableCell>

              {/* Machine type */}
              <TableCell>
                <Typography variant="body2">
                  {product.machineType ? machineTypeLabels[product.machineType] : '—'}
                </Typography>
              </TableCell>

              {/* Axes */}
              <TableCell align="center">
                <Typography variant="body2">
                  {product.numberOfAxes > 0 ? product.numberOfAxes : '—'}
                </Typography>
              </TableCell>

              {/* Price */}
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={product.priceEur === 0 ? 'success.main' : 'text.primary'}
                >
                  {product.priceEur === 0 ? 'Free' : `€${product.priceEur}`}
                </Typography>
              </TableCell>

              {/* Downloads */}
              <TableCell align="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  <DownloadIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{product.downloadCount ?? 0}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
