import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Select,
  MenuItem,
  IconButton,
  Button,
  Divider,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Public as PublicIcon,
  Download as DownloadIcon,
  Science as TrialIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import type { Product, FilterOptions, SearchRequest } from '../types';
import {
  contentTypeLabels,
  contentTypeColors,
  machineTypeLabels,
  publicationStatusLabels,
  ExperienceStatus,
} from '../types';
import { productsApi, licensesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const placeholderImage =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" fill="#2a2d3a">
    <rect width="200" height="140" rx="8"/>
    <text x="100" y="70" text-anchor="middle" dominant-baseline="middle"
          font-family="Inter,sans-serif" font-size="24" fill="#444">CNC</text>
  </svg>`);

function formatEnum(value: string): string {
  if (!value) return value;
  if (!value.includes('_') && !/^[A-Z_]+$/.test(value)) return value;
  return value
    .split('_')
    .map((w) =>
      w.length <= 3 && /^[A-Z]+$/.test(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(' ');
}

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  const PAGE_SIZE = 30;

  const [sortMode, setSortMode] = useState<'recent' | 'popular'>('recent');
  const [filters, setFilters] = useState<SearchRequest>({ page: 0, size: PAGE_SIZE, sortBy: 'createdAt', sortDir: 'desc' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const productsRef = useRef<Product[]>([]);
  const filtersRef = useRef(filters);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { productsRef.current = products; }, [products]);

  useEffect(() => {
    productsApi.getFilters().then(setFilterOptions).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productsApi.search({ ...filters, page: 0, size: PAGE_SIZE });
      setProducts(res.content);
      const more = res.content.length < res.totalElements;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      setError('Failed to load projects. Check if the API is running.');
      setProducts([]);
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = Math.floor(productsRef.current.length / PAGE_SIZE);
      const res = await productsApi.search({ ...filtersRef.current, page: nextPage, size: PAGE_SIZE });
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = res.content.filter((p) => !existingIds.has(p.id));
        const updated = [...prev, ...newItems];
        productsRef.current = updated;
        return updated;
      });
      const more = res.content.length === PAGE_SIZE && (nextPage + 1) * PAGE_SIZE < res.totalElements;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      // silently fail
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: null, threshold: 0, rootMargin: '600px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, loading]);

  const handleFilterChange = (field: keyof SearchRequest, value: unknown) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined, page: 0 }));
  };

  const clearFilters = () => {
    setFilters({ page: 0, size: PAGE_SIZE, sortBy: filters.sortBy, sortDir: filters.sortDir });
  };

  const activeFilterCount = [
    filters.contentType,
    filters.category,
    filters.machineManufacturer,
    filters.controllerManufacturer,
    filters.machineType,
    filters.numberOfAxes,
    filters.contentOwner,
  ].filter(Boolean).length;

  const handleDownload = async () => {
    if (!selectedProduct) return;
    try {
      await productsApi.recordDownload(selectedProduct.id);
      setSelectedProduct((p) => p ? { ...p, downloadCount: (p.downloadCount ?? 0) + 1 } : p);
      setSnackbar({ open: true, message: 'Download recorded', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Download failed', severity: 'error' });
    }
  };

  const handleTrial = async () => {
    if (!selectedProduct || !user) return;
    try {
      await licensesApi.issueTrial(user.userId, selectedProduct.id);
      setSnackbar({ open: true, message: 'Trial license issued!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to issue trial', severity: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ==================== TOP BAR (Sort + Filters toggle) ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          px: 1.5,
          py: 0.5,
          flexShrink: 0,
          justifyContent: 'flex-end',
        }}
      >
        <Select
          value={sortMode}
          onChange={(e) => {
            const mode = e.target.value as 'recent' | 'popular';
            setSortMode(mode);
            setFilters((prev) => ({
              ...prev,
              sortBy: mode === 'recent' ? 'createdAt' : 'downloadCount',
              sortDir: 'desc',
              page: 0,
              size: PAGE_SIZE,
            }));
          }}
          variant="standard"
          disableUnderline
          sx={{
            bgcolor: '#262830',
            borderRadius: '16px',
            border: '1px solid #3A3E46',
            px: 1.8,
            height: 34,
            fontSize: '0.82rem',
            color: '#C0C4D0',
            flexShrink: 0,
            '& .MuiSelect-select': {
              py: 0,
              pr: '26px !important',
              pl: 0.5,
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiSelect-icon': {
              color: '#808599',
              fontSize: 18,
              right: 8,
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#262830',
                border: '1px solid #3A3E46',
                borderRadius: '10px',
                mt: 0.5,
                py: 0.5,
                '& .MuiMenuItem-root': {
                  fontSize: '0.85rem',
                  color: '#A0A4B0',
                  py: 1,
                  px: 2,
                  '&:hover': { bgcolor: '#2A2E38' },
                  '&.Mui-selected': {
                    bgcolor: 'transparent',
                    color: '#fff',
                    borderLeft: '3px solid #00CB9A',
                    pl: 1.6,
                    '&:hover': { bgcolor: '#2A2E38' },
                  },
                },
              },
            },
          }}
        >
          <MenuItem value="recent">Recent</MenuItem>
          <MenuItem value="popular">Popular</MenuItem>
        </Select>

        <Box
          onClick={() => setFiltersVisible((v) => !v)}
          sx={{
            bgcolor: filtersVisible ? 'rgba(0,203,154,0.1)' : '#2A2E38',
            borderRadius: '16px',
            border: filtersVisible ? '1px solid #00CB9A' : '1px solid #3A3E46',
            px: 2,
            py: 0.5,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.15s',
            '&:hover': {
              borderColor: filtersVisible ? '#00CB9A' : '#505460',
              bgcolor: filtersVisible ? 'rgba(0,203,154,0.15)' : '#323642',
            },
          }}
        >
          <Typography sx={{ color: filtersVisible ? '#00CB9A' : '#C0C4D0', fontSize: '0.82rem', fontWeight: 600 }}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Typography>
        </Box>
      </Box>

      {/* ==================== COLLAPSIBLE FILTER BAR ==================== */}
      {filtersVisible && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1.5,
            py: 0.5,
            overflowX: 'auto',
            flexShrink: 0,
            '&::-webkit-scrollbar': { height: 3 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2 },
          }}
        >
          <FilterChip
            label="Category"
            value={filters.category || ''}
            options={filterOptions?.categories ?? []}
            onChange={(v) => handleFilterChange('category', v)}
          />
          <FilterChip
            label="Content"
            value={filters.contentType || ''}
            options={filterOptions?.contentTypes ?? []}
            onChange={(v) => handleFilterChange('contentType', v)}
          />
          <FilterChip
            label="Machine type"
            value={filters.machineType || ''}
            options={filterOptions?.machineTypes ?? []}
            onChange={(v) => handleFilterChange('machineType', v)}
          />
          <FilterChip
            label="Provided by"
            value={filters.machineManufacturer || ''}
            options={filterOptions?.machineManufacturers ?? []}
            onChange={(v) => handleFilterChange('machineManufacturer', v)}
          />
          <FilterChip
            label="Controller"
            value={filters.controllerManufacturer || ''}
            options={filterOptions?.controllerManufacturers ?? []}
            onChange={(v) => handleFilterChange('controllerManufacturer', v)}
          />
          <FilterChip
            label="Axes"
            value={filters.numberOfAxes ?? ''}
            options={(filterOptions?.numberOfAxes ?? []).map(String)}
            onChange={(v) => handleFilterChange('numberOfAxes', v ? Number(v) : undefined)}
          />
          <FilterChip
            label="Owner"
            value={filters.contentOwner || ''}
            options={filterOptions?.contentOwners ?? []}
            onChange={(v) => handleFilterChange('contentOwner', v)}
          />

          {activeFilterCount > 0 && (
            <Typography
              onClick={clearFilters}
              sx={{
                fontSize: '0.72rem',
                color: 'rgba(245,245,245,0.4)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                ml: 0.5,
                '&:hover': { color: 'rgba(245,245,245,0.7)' },
              }}
            >
              Clear all
            </Typography>
          )}
        </Box>
      )}

      {/* ==================== CONTENT ==================== */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {error && (
          <Alert severity="warning" sx={{ mx: 1.5, mb: 1, bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ffb74d' }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            px: 1,
            pb: 1,
          }}
        >
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={250}
                  height={230}
                  sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1.5, flexShrink: 0 }}
                />
              ))
            : products.map((product) => (
                <ProjectCard
                  key={product.id}
                  product={product}
                  selected={selectedProduct?.id === product.id}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}

          {loadingMore &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={`more-${i}`}
                variant="rounded"
                width={250}
                height={230}
                sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1.5, flexShrink: 0 }}
              />
            ))}
        </Box>

        {!loading && hasMore && <Box ref={sentinelRef} sx={{ height: 20 }} />}
      </Box>

      {/* ==================== DETAIL OVERLAY ==================== */}
      {selectedProduct && (
        <Box
          onClick={() => setSelectedProduct(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.6)',
            zIndex: 1200,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: 420,
              height: '100%',
              bgcolor: '#1E2230',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={() => setSelectedProduct(null)}
              sx={{
                position: 'sticky',
                top: 8,
                float: 'right',
                mr: 1,
                mt: 1,
                color: 'rgba(245,245,245,0.7)',
                zIndex: 10,
                bgcolor: 'rgba(30,34,48,0.8)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <DetailPanel
              product={selectedProduct}
              isAuthenticated={isAuthenticated}
              onDownload={handleDownload}
              onTrial={handleTrial}
            />
          </Box>
        </Box>
      )}

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

/* ─── Filter Chip Component ─── */

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'rgba(255,255,255,0.06)',
        borderRadius: '4px',
        border: '1px solid rgba(255,255,255,0.08)',
        height: 26,
        px: 0.8,
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.72rem',
          color: 'rgba(245,245,245,0.45)',
          mr: 0.3,
          whiteSpace: 'nowrap',
        }}
      >
        {label}:
      </Typography>
      <Select
        value={String(value)}
        onChange={(e) => onChange(e.target.value as string)}
        variant="standard"
        disableUnderline
        sx={{
          fontSize: '0.72rem',
          color: '#C0C4D0',
          minWidth: 30,
          '& .MuiSelect-select': {
            py: 0,
            pr: '18px !important',
            pl: 0.3,
          },
          '& .MuiSelect-icon': {
            color: 'rgba(245,245,245,0.35)',
            fontSize: 16,
            right: 0,
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: '#262830',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 1,
              mt: 0.5,
              '& .MuiMenuItem-root': {
                fontSize: '0.75rem',
                color: '#C0C4D0',
                py: 0.6,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                '&.Mui-selected': { bgcolor: '#00CB9A', color: '#fff' },
              },
            },
          },
        }}
      >
        <MenuItem value="">All</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {formatEnum(opt)}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

/* ─── Project Card (matches WPF layout) ─── */

function ProjectCard({ product, selected, onClick }: { product: Product; selected?: boolean; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 250,
        borderRadius: 2,
        bgcolor: '#1E2230',
        border: '2px solid',
        borderColor: selected ? '#00BCD4' : 'transparent',
        boxShadow: selected ? '0 0 12px rgba(0,188,212,0.25)' : 'none',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: '#00BCD4',
          boxShadow: '0 0 12px rgba(0,188,212,0.25)',
        },
      }}
    >
      {/* Image area */}
      <Box
        sx={{
          height: 150,
          bgcolor: '#2A2D3A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={product.imageUrl || placeholderImage}
          alt={product.name}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = placeholderImage;
          }}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>

      {/* Info */}
      <Box sx={{ px: 1.5, py: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#E8E8E8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {product.name}
          </Typography>
          {product.publicationStatus === 'PUBLISHED' && (
            <Box
              sx={{
                bgcolor: '#1A1E28',
                borderRadius: '50%',
                width: 20,
                height: 20,
                minWidth: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #00CB9A',
                mt: 0.2,
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', color: '#00CB9A', fontWeight: 700, lineHeight: 1 }}>✔</Typography>
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(245,245,245,0.35)', mt: 0.5 }}>
          Update: {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: 'rgba(245,245,245,0.35)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mt: 0.5,
          }}
        >
          {product.productOwner || 'ENCY Clouds'}
        </Typography>
      </Box>

    </Box>
  );
}

/* ─── Detail Side Panel (matches WPF ProductDetailView) ─── */

function DetailPanel({
  product,
  isAuthenticated,
  onDownload,
  onTrial,
}: {
  product: Product;
  isAuthenticated: boolean;
  onDownload: () => void;
  onTrial: () => void;
}) {
  return (
    <Box sx={{ p: 2, pt: 1.5 }}>
      {/* Image */}
      {product.imageUrl && (
        <Box
          component="img"
          src={product.imageUrl}
          alt={product.name}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
          sx={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'contain',
            borderRadius: 2,
            mb: 1.5,
          }}
        />
      )}

      {/* Name */}
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#F5F5F5', mb: 0.5 }}>
        {product.name}
      </Typography>

      {/* Badges */}
      <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5 }}>
        <Chip
          label={contentTypeLabels[product.contentType] || formatEnum(product.contentType)}
          size="small"
          sx={{
            background: 'linear-gradient(135deg, #00CB9A, #1269D9)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 22,
          }}
        />
        <Chip
          label={formatEnum(product.category)}
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(245,245,245,0.5)',
            fontSize: '0.65rem',
            height: 22,
          }}
        />
      </Box>

      {/* Description */}
      {product.description && (
        <Typography sx={{ fontSize: '0.78rem', color: 'rgba(245,245,245,0.5)', lineHeight: 1.6, mb: 0.5 }}>
          {product.description}
        </Typography>
      )}

      {/* Kit Contents */}
      {product.kitContents && (
        <>
          <SectionLabel>Kit Contents</SectionLabel>
          <FieldValue>{product.kitContents}</FieldValue>
        </>
      )}

      <SectionDivider />

      {/* MACHINE INFORMATION */}
      <SectionTitle>MACHINE INFORMATION</SectionTitle>
      <FieldRow>
        <FieldBlock label="Manufacturer" value={product.machineManufacturer} />
        <FieldBlock label="Machine Type" value={product.machineType ? machineTypeLabels[product.machineType] : undefined} />
      </FieldRow>
      <FieldRow>
        <FieldBlock label="Series" value={product.machineSeries} />
        <FieldBlock label="Model" value={product.machineModel} />
      </FieldRow>
      <FieldRow>
        <FieldBlock label="Number of Axes" value={product.numberOfAxes > 0 ? String(product.numberOfAxes) : undefined} />
      </FieldRow>

      <SectionDivider />

      {/* CONTROLLER */}
      <SectionTitle>CONTROLLER</SectionTitle>
      <FieldRow>
        <FieldBlock label="Manufacturer" value={product.controllerManufacturer} />
        <FieldBlock label="Series" value={product.controllerSeries} />
      </FieldRow>
      <FieldRow>
        <FieldBlock label="Model" value={product.controllerModel} />
      </FieldRow>

      <SectionDivider />

      {/* SOFTWARE */}
      <SectionTitle>SOFTWARE</SectionTitle>
      <FieldBlock label="Min Software Version" value={product.minSoftwareVersion} />
      {product.supportedCodes && <FieldBlock label="Supported Codes" value={product.supportedCodes} />}

      <SectionDivider />

      {/* PRICING */}
      <SectionTitle>PRICING &amp; LICENSE</SectionTitle>
      <FieldRow>
        <Box sx={{ flex: 1 }}>
          <FieldLabel>Price</FieldLabel>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#00CB9A', mb: 1 }}>
            {product.priceEur === 0 ? 'Free' : `${product.priceEur?.toFixed(2)} €`}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <FieldLabel>Trial Period</FieldLabel>
          <FieldValue>{product.trialDays > 0 ? `${product.trialDays} days` : '—'}</FieldValue>
        </Box>
      </FieldRow>

      <SectionDivider />

      {/* DETAILS */}
      <SectionTitle>DETAILS</SectionTitle>
      <FieldRow>
        <FieldBlock label="Author" value={product.authorName} />
        <FieldBlock label="Product Owner" value={product.productOwner} />
      </FieldRow>
      <FieldRow>
        <FieldBlock label="Status" value={product.publicationStatus ? publicationStatusLabels[product.publicationStatus] : undefined} />
        <FieldBlock label="Downloads" value={String(product.downloadCount ?? 0)} />
      </FieldRow>
      <FieldRow>
        <FieldBlock label="Created" value={product.createdAt ? new Date(product.createdAt).toLocaleDateString() : undefined} />
        <FieldBlock label="Updated" value={product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : undefined} />
      </FieldRow>
      <FieldRow>
        <FieldBlock label="Published" value={product.publishedAt ? new Date(product.publishedAt).toLocaleDateString() : undefined} />
        <FieldBlock label="Experience" value={product.experienceStatus === ExperienceStatus.VERIFIED_ON_EQUIPMENT ? 'Verified' : 'Not tested'} />
      </FieldRow>

      <SectionDivider />

      {/* ACTIONS */}
      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {product.trialDays > 0 && (
          <Button
            fullWidth
            variant="contained"
            disabled={!isAuthenticated}
            startIcon={<TrialIcon />}
            onClick={onTrial}
            sx={{
              background: isAuthenticated ? 'linear-gradient(135deg, #00CB9A, #1269D9)' : undefined,
              fontWeight: 600,
              py: 1,
              '&:hover': { opacity: 0.85 },
              '&.Mui-disabled': {
                background: 'linear-gradient(135deg, rgba(0,203,154,0.35), rgba(18,105,217,0.35))',
                color: 'rgba(255,255,255,0.4)',
              },
            }}
          >
            Get Trial License
          </Button>
        )}
        <Button
          fullWidth
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          sx={{
            bgcolor: '#1269D9',
            fontWeight: 600,
            py: 0.8,
            '&:hover': { bgcolor: '#0d4a97' },
          }}
        >
          Record Download
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Detail Panel helpers ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#00CB9A', letterSpacing: 0.5, mt: 1.5, mb: 1 }}>
      {children}
    </Typography>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(245,245,245,0.4)', mb: 0.2 }}>
      {children}
    </Typography>
  );
}

function SectionDivider() {
  return <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.5 }} />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(245,245,245,0.4)', mb: 0.2 }}>
      {children}
    </Typography>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.82rem', color: '#F5F5F5', mb: 0.8, wordBreak: 'break-word' }}>
      {children || '—'}
    </Typography>
  );
}

function FieldBlock({ label, value }: { label: string; value?: string }) {
  return (
    <Box sx={{ flex: 1 }}>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </Box>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {children}
    </Box>
  );
}
