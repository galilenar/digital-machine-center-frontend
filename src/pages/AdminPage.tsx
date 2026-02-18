import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import type { Product } from '../types';
import {
  PublicationStatus,
  publicationStatusLabels,
  statusColors,
  contentTypeLabels,
  contentTypeColors,
  machineTypeLabels,
  ExperienceStatus,
} from '../types';
import { productsApi } from '../services/api';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load products', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    let result = products;
    if (statusTab !== 'ALL') {
      result = result.filter((p) => p.publicationStatus === statusTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.machineManufacturer?.toLowerCase().includes(q) ||
          p.productOwner?.toLowerCase().includes(q),
      );
    }
    setFilteredProducts(result);
  }, [products, statusTab, searchQuery]);

  const handleApprove = async (product: Product) => {
    try {
      await productsApi.updateStatus(product.id, PublicationStatus.PUBLISHED);
      setSnackbar({
        open: true,
        message: `"${product.name}" published and visible to customers`,
        severity: 'success',
      });
      fetchAll();
      if (selectedProduct?.id === product.id) {
        setSelectedProduct({ ...product, publicationStatus: PublicationStatus.PUBLISHED });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to approve', severity: 'error' });
    }
  };

  const handleReject = async (product: Product) => {
    try {
      await productsApi.updateStatus(product.id, PublicationStatus.REJECTED);
      setSnackbar({
        open: true,
        message: `"${product.name}" rejected`,
        severity: 'success',
      });
      fetchAll();
      if (selectedProduct?.id === product.id) {
        setSelectedProduct({ ...product, publicationStatus: PublicationStatus.REJECTED });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to reject', severity: 'error' });
    }
  };

  const handleHide = async (product: Product) => {
    try {
      await productsApi.updateStatus(product.id, PublicationStatus.DRAFT);
      setSnackbar({
        open: true,
        message: `"${product.name}" hidden from public`,
        severity: 'success',
      });
      fetchAll();
      if (selectedProduct?.id === product.id) {
        setSelectedProduct({ ...product, publicationStatus: PublicationStatus.DRAFT });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to hide', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    try {
      await productsApi.delete(deleteDialog.product.id);
      setSnackbar({ open: true, message: 'Product deleted', severity: 'success' });
      setDeleteDialog({ open: false, product: null });
      if (selectedProduct?.id === deleteDialog.product.id) {
        setSelectedProduct(null);
      }
      fetchAll();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  const statusCounts = {
    ALL: products.length,
    [PublicationStatus.PENDING_REVIEW]: products.filter(
      (p) => p.publicationStatus === PublicationStatus.PENDING_REVIEW,
    ).length,
    [PublicationStatus.PUBLISHED]: products.filter(
      (p) => p.publicationStatus === PublicationStatus.PUBLISHED,
    ).length,
    [PublicationStatus.DRAFT]: products.filter(
      (p) => p.publicationStatus === PublicationStatus.DRAFT,
    ).length,
    [PublicationStatus.REJECTED]: products.filter(
      (p) => p.publicationStatus === PublicationStatus.REJECTED,
    ).length,
  };

  const DetailField = ({ label, value }: { label: string; value?: string | number | null }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(245,245,245,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', color: '#F5F5F5', mt: 0.2 }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 68px)', overflow: 'hidden' }}>
      {/* Main area */}
      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Content Moderation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              Review and manage products
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchAll}
            sx={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(245,245,245,0.6)' }}
          >
            Refresh
          </Button>
        </Box>

        {/* Status tabs */}
        <Tabs
          value={statusTab}
          onChange={(_, v) => setStatusTab(v)}
          sx={{
            mb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' },
          }}
        >
          <Tab
            label={
              <Badge badgeContent={statusCounts.ALL} color="primary" max={999}>
                <Box sx={{ pr: 2 }}>All</Box>
              </Badge>
            }
            value="ALL"
          />
          <Tab
            label={
              <Badge badgeContent={statusCounts[PublicationStatus.PENDING_REVIEW]} color="warning" max={999}>
                <Box sx={{ pr: 2 }}>Pending</Box>
              </Badge>
            }
            value={PublicationStatus.PENDING_REVIEW}
          />
          <Tab
            label={
              <Badge badgeContent={statusCounts[PublicationStatus.PUBLISHED]} color="success" max={999}>
                <Box sx={{ pr: 2 }}>Published</Box>
              </Badge>
            }
            value={PublicationStatus.PUBLISHED}
          />
          <Tab label="Drafts" value={PublicationStatus.DRAFT} />
          <Tab label="Rejected" value={PublicationStatus.REJECTED} />
        </Tabs>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search products..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'rgba(245,245,245,0.35)' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={56} />
            ))}
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      color: 'text.secondary',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No products found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      hover
                      selected={selectedProduct?.id === product.id}
                      onClick={() => setSelectedProduct(product)}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': { bgcolor: 'rgba(0,203,154,0.06)' },
                        '&.Mui-selected:hover': { bgcolor: 'rgba(0,203,154,0.09)' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            variant="rounded"
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.06)',
                              width: 36,
                              height: 36,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            {product.name.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.machineManufacturer}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contentTypeLabels[product.contentType]}
                          size="small"
                          sx={{
                            bgcolor: contentTypeColors[product.contentType] + '18',
                            color: contentTypeColors[product.contentType],
                            fontWeight: 600,
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
                          {product.productOwner || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={publicationStatusLabels[product.publicationStatus]}
                          size="small"
                          sx={{
                            bgcolor: statusColors[product.publicationStatus] + '18',
                            color: statusColors[product.publicationStatus],
                            fontWeight: 600,
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {product.createdAt
                            ? new Date(product.createdAt).toLocaleDateString()
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3 }}>
                          {product.publicationStatus !== PublicationStatus.PUBLISHED && (
                            <Tooltip title="Approve (publish)">
                              <IconButton
                                size="small"
                                sx={{ color: '#4caf50' }}
                                onClick={() => handleApprove(product)}
                              >
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {product.publicationStatus === PublicationStatus.PUBLISHED && (
                            <Tooltip title="Unpublish">
                              <IconButton
                                size="small"
                                sx={{ color: '#ff9800' }}
                                onClick={() => handleHide(product)}
                              >
                                <HideIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {product.publicationStatus !== PublicationStatus.REJECTED && (
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                sx={{ color: '#f44336' }}
                                onClick={() => handleReject(product)}
                              >
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              sx={{ color: 'rgba(245,245,245,0.35)' }}
                              onClick={() => setDeleteDialog({ open: true, product })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Detail side panel */}
      {selectedProduct && (
        <Box
          sx={{
            width: 360,
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(255,255,255,0.02)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {/* Panel header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Product Details
            </Typography>
            <IconButton size="small" onClick={() => setSelectedProduct(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Panel content */}
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {/* Status + actions at the top */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={publicationStatusLabels[selectedProduct.publicationStatus]}
                size="small"
                sx={{
                  bgcolor: statusColors[selectedProduct.publicationStatus] + '18',
                  color: statusColors[selectedProduct.publicationStatus],
                  fontWeight: 600,
                }}
              />
              {selectedProduct.publicationStatus !== PublicationStatus.PUBLISHED && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleApprove(selectedProduct)}
                  sx={{
                    bgcolor: '#4caf50',
                    fontSize: '0.7rem',
                    py: 0.3,
                    '&:hover': { bgcolor: '#388e3c' },
                  }}
                >
                  Approve
                </Button>
              )}
              {selectedProduct.publicationStatus === PublicationStatus.PUBLISHED && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<HideIcon />}
                  onClick={() => handleHide(selectedProduct)}
                  sx={{
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    fontSize: '0.7rem',
                    py: 0.3,
                  }}
                >
                  Unpublish
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <DetailField label="Name" value={selectedProduct.name} />
            <DetailField
              label="Content Type"
              value={contentTypeLabels[selectedProduct.contentType]}
            />
            <DetailField
              label="Machine Type"
              value={machineTypeLabels[selectedProduct.machineType]}
            />
            <DetailField
              label="Machine Manufacturer"
              value={selectedProduct.machineManufacturer}
            />
            <DetailField label="Machine Model" value={selectedProduct.machineModel} />
            <DetailField label="Machine Series" value={selectedProduct.machineSeries} />
            <DetailField label="Number of Axes" value={selectedProduct.numberOfAxes} />

            <Divider sx={{ my: 1.5 }} />

            <DetailField
              label="Controller Manufacturer"
              value={selectedProduct.controllerManufacturer}
            />
            <DetailField label="Controller Series" value={selectedProduct.controllerSeries} />
            <DetailField label="Controller Model" value={selectedProduct.controllerModel} />
            <DetailField
              label="Min Software Version"
              value={selectedProduct.minSoftwareVersion}
            />

            <Divider sx={{ my: 1.5 }} />

            <DetailField
              label="Price"
              value={
                selectedProduct.priceEur > 0
                  ? `€${selectedProduct.priceEur}`
                  : 'Free'
              }
            />
            <DetailField label="Trial Period" value={`${selectedProduct.trialDays} days`} />
            <DetailField label="Owner" value={selectedProduct.productOwner} />
            <DetailField label="Author" value={selectedProduct.authorName} />
            <DetailField
              label="Verification"
              value={
                selectedProduct.experienceStatus === ExperienceStatus.VERIFIED_ON_EQUIPMENT
                  ? 'Verified on Equipment'
                  : 'Not Tested'
              }
            />
            <DetailField label="Downloads" value={selectedProduct.downloadCount} />
            <DetailField
              label="Created"
              value={
                selectedProduct.createdAt
                  ? new Date(selectedProduct.createdAt).toLocaleString()
                  : undefined
              }
            />
            <DetailField
              label="Updated"
              value={
                selectedProduct.updatedAt
                  ? new Date(selectedProduct.updatedAt).toLocaleString()
                  : undefined
              }
            />

            {selectedProduct.description && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    color: 'rgba(245,245,245,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 0.5,
                  }}
                >
                  Description
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(245,245,245,0.7)', lineHeight: 1.5 }}>
                  {selectedProduct.description}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Delete dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.product?.name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
