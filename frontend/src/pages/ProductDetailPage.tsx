import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Skeleton,
  Alert,
  Snackbar,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  ShoppingCart as CartIcon,
  CheckCircle as VerifiedIcon,
  Science as TrialIcon,
  Settings as GearIcon,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import type { Product } from '../types';
import {
  contentTypeLabels,
  contentTypeColors,
  machineTypeLabels,
  publicationStatusLabels,
  statusColors,
  ExperienceStatus,
} from '../types';
import { productsApi, licensesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const placeholderImage =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" fill="#e8eaf6">
    <rect width="600" height="400"/>
    <text x="300" y="200" text-anchor="middle" dominant-baseline="middle"
          font-family="Inter,sans-serif" font-size="60" fill="#9fa8da">CNC</text>
  </svg>`);

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsApi
      .getById(Number(id))
      .then(setProduct)
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!product) return;
    try {
      await productsApi.recordDownload(product.id);
      setProduct((prev) => (prev ? { ...prev, downloadCount: (prev.downloadCount ?? 0) + 1 } : prev));
      setSnackbar({ open: true, message: 'Download recorded successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to record download', severity: 'error' });
    }
  };

  const handleRequestTrial = async () => {
    if (!product || !user) return;
    try {
      await licensesApi.issueTrial(user.userId, product.id);
      setSnackbar({ open: true, message: 'Trial license issued!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to issue trial license', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Skeleton variant="rounded" height={40} width={200} sx={{ mb: 3 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton height={40} width="70%" sx={{ mb: 2 }} />
            <Skeleton height={24} width="40%" sx={{ mb: 3 }} />
            <Skeleton height={120} sx={{ mb: 2 }} />
            <Skeleton height={200} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Product not found'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/')}>
          Back to Library
        </Button>
      </Box>
    );
  }

  const specRows = [
    { label: 'Machine Manufacturer', value: product.machineManufacturer },
    { label: 'Machine Series', value: product.machineSeries },
    { label: 'Machine Model', value: product.machineModel },
    { label: 'Machine Type', value: product.machineType ? machineTypeLabels[product.machineType] : null },
    { label: 'Number of Axes', value: product.numberOfAxes > 0 ? product.numberOfAxes : null },
    { label: 'Controller Manufacturer', value: product.controllerManufacturer },
    { label: 'Controller Series', value: product.controllerSeries },
    { label: 'Controller Model', value: product.controllerModel },
    { label: 'Min Software Version', value: product.minSoftwareVersion },
    { label: 'Author', value: product.authorName },
    { label: 'Product Owner', value: product.productOwner },
    { label: 'Trial Days', value: product.trialDays > 0 ? `${product.trialDays} days` : null },
  ].filter((r) => r.value);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Library
        </Link>
        <Typography color="text.primary" noWrap sx={{ maxWidth: 300 }}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* ─── Image ─── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            sx={{
              overflow: 'hidden',
              borderRadius: 3,
              position: 'relative',
            }}
          >
            <Box
              component="img"
              src={product.imageUrl || placeholderImage}
              alt={product.name}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = placeholderImage;
              }}
              sx={{
                width: '100%',
                height: 380,
                objectFit: 'cover',
                display: 'block',
                bgcolor: '#e8eaf6',
              }}
            />
            {/* Status badge */}
            <Chip
              label={publicationStatusLabels[product.publicationStatus]}
              size="small"
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: statusColors[product.publicationStatus],
                color: '#fff',
                fontWeight: 600,
              }}
            />
          </Paper>

          {/* Sample output code */}
          {product.sampleOutputCode && (
            <Paper sx={{ mt: 2, p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Sample Output
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: '#1a1a2e',
                  color: '#e0e0e0',
                  p: 2,
                  borderRadius: 1.5,
                  fontSize: '0.78rem',
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  overflow: 'auto',
                  maxHeight: 300,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {product.sampleOutputCode}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* ─── Details ─── */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Content type badge */}
          <Chip
            label={contentTypeLabels[product.contentType]}
            size="small"
            sx={{
              bgcolor: contentTypeColors[product.contentType],
              color: '#fff',
              fontWeight: 600,
              mb: 1.5,
            }}
          />

          {/* Title */}
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {product.name}
          </Typography>

          {/* Experience badge */}
          {product.experienceStatus === ExperienceStatus.VERIFIED_ON_EQUIPMENT && (
            <Chip
              icon={<VerifiedIcon />}
              label="Verified on Equipment"
              color="success"
              size="small"
              sx={{ mb: 2 }}
            />
          )}

          {/* Price + Actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              my: 3,
              p: 2.5,
              bgcolor: '#f5f6fa',
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {product.priceEur === 0 ? 'Free' : `€${product.priceEur}`}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isAuthenticated && product.trialDays > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<TrialIcon />}
                  onClick={handleRequestTrial}
                >
                  Try {product.trialDays} days
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={product.priceEur === 0 ? <DownloadIcon /> : <CartIcon />}
                onClick={handleDownload}
                size="large"
              >
                {product.priceEur === 0 ? 'Download' : 'Get'}
              </Button>
            </Box>
          </Box>

          {/* Downloads count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
            <DownloadIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {product.downloadCount ?? 0} downloads
            </Typography>
          </Box>

          {/* Description */}
          {product.description && (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Description
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.7, whiteSpace: 'pre-line' }}
              >
                {product.description}
              </Typography>
            </>
          )}

          {/* Kit Contents */}
          {product.kitContents && (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Kit Contents
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.7, whiteSpace: 'pre-line' }}
              >
                {product.kitContents}
              </Typography>
            </>
          )}

          {/* Supported Codes */}
          {product.supportedCodes && (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Supported Codes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                {product.supportedCodes.split(/[,;]\s*/).map((code, i) => (
                  <Chip key={i} label={code.trim()} size="small" variant="outlined" />
                ))}
              </Box>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Specifications table */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Specifications
          </Typography>
          <Table size="small" sx={{ '& td': { py: 1.2 } }}>
            <TableBody>
              {specRows.map((row) => (
                <TableRow key={row.label} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell
                    sx={{
                      fontWeight: 500,
                      color: 'text.secondary',
                      width: '40%',
                      pl: 0,
                    }}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Dates */}
          <Box sx={{ mt: 3, display: 'flex', gap: 3 }}>
            {product.createdAt && (
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(product.createdAt).toLocaleDateString()}
              </Typography>
            )}
            {product.publishedAt && (
              <Typography variant="caption" color="text.secondary">
                Published: {new Date(product.publishedAt).toLocaleDateString()}
              </Typography>
            )}
            {product.updatedAt && (
              <Typography variant="caption" color="text.secondary">
                Updated: {new Date(product.updatedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
