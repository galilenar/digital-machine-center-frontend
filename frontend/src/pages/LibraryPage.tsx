import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Select,
  MenuItem,
  Button,
  Divider,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Science as TrialIcon,
  FilterList as FilterListIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import type { Product, FilterOptions, SearchRequest } from '../types';
import {
  ContentType,
  contentTypeLabels,
  contentTypeColors,
  machineTypeLabels,
  publicationStatusLabels,
  ExperienceStatus,
} from '../types';
import { productsApi, licensesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { CategoryTab } from '../components/Layout';

const placeholderImage =
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" fill="#2a2d3a">
    <rect width="200" height="140" rx="8"/>
    <text x="100" y="70" text-anchor="middle" dominant-baseline="middle"
          font-family="Inter,sans-serif" font-size="24" fill="#444">CNC</text>
  </svg>`);

const contentTypeTabs = [
  { label: 'All', value: '' },
  { label: 'Machine Schema', value: ContentType.MACHINE_SCHEMA },
  { label: 'Post-processor', value: ContentType.POST_PROCESSOR },
  { label: 'Interpreter', value: ContentType.INTERPRETER },
  { label: 'Digital machine kit', value: ContentType.DIGITAL_MACHINE_KIT },
];

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
  const { activeCategory } = useOutletContext<{ activeCategory: CategoryTab }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  const PAGE_SIZE = 30;

  const [sortMode, setSortMode] = useState<'recent' | 'popular'>('recent');
  const [activeContentType, setActiveContentType] = useState('');
  const [filters, setFilters] = useState<SearchRequest>({ page: 0, size: PAGE_SIZE, sortBy: 'createdAt', sortDir: 'desc' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const nextPageRef = useRef(1);
  const filtersRef = useRef(filters);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  useEffect(() => {
    productsApi.getFilters().then(setFilterOptions).catch(() => {});
  }, []);

  // Sync category tab from Layout
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: activeCategory === 'ALL' ? undefined : activeCategory,
      page: 0,
    }));
  }, [activeCategory]);

  // Sync content type tab
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      contentType: activeContentType ? (activeContentType as ContentType) : undefined,
      page: 0,
    }));
  }, [activeContentType]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productsApi.search({ ...filters, page: 0, size: PAGE_SIZE });
      setProducts(res.content);
      nextPageRef.current = 1;
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
      const page = nextPageRef.current;
      const res = await productsApi.search({ ...filtersRef.current, page, size: PAGE_SIZE });
      nextPageRef.current = page + 1;
      setProducts((prev) => [...prev, ...res.content]);
      const more = res.content.length === PAGE_SIZE && (page + 1) * PAGE_SIZE < res.totalElements;
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
      {/* ==================== TOP BAR ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.2,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Filters button */}
        <Box
          onClick={() => setFiltersVisible((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 2,
            py: 0.7,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: filtersVisible ? '#00CB9A' : 'rgba(255,255,255,0.1)',
            bgcolor: filtersVisible ? 'rgba(0,203,154,0.1)' : 'transparent',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.15s',
            flexShrink: 0,
            '&:hover': { borderColor: filtersVisible ? '#00CB9A' : 'rgba(255,255,255,0.2)' },
          }}
        >
          <FilterListIcon sx={{ fontSize: 16, color: filtersVisible ? '#00CB9A' : 'rgba(255,255,255,0.6)' }} />
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: filtersVisible ? '#00CB9A' : 'rgba(255,255,255,0.7)' }}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Content type tabs */}
        <Box
          sx={{
            display: 'flex',
            bgcolor: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          {contentTypeTabs.map((tab) => (
            <Box
              key={tab.value}
              onClick={() => setActiveContentType(tab.value)}
              sx={{
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                color: activeContentType === tab.value ? '#fff' : 'rgba(255,255,255,0.6)',
                bgcolor: activeContentType === tab.value ? '#1269D9' : 'transparent',
                borderRadius: activeContentType === tab.value ? '6px' : 0,
                transition: 'all 0.15s',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { color: '#fff' },
              }}
            >
              {tab.label}
            </Box>
          ))}
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Sort dropdown */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            px: 1.5,
            py: 0.5,
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            flexShrink: 0,
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
              }));
            }}
            variant="standard"
            disableUnderline
            IconComponent={ArrowDownIcon}
            sx={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.7)',
              '& .MuiSelect-select': { py: 0, pr: '24px !important', pl: 0 },
              '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)', fontSize: 18 },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: '#1E2230',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  mt: 0.5,
                  '& .MuiMenuItem-root': {
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                    '&.Mui-selected': { bgcolor: 'rgba(18,105,217,0.2)', color: '#fff' },
                  },
                },
              },
            }}
          >
            <MenuItem value="recent">Recent</MenuItem>
            <MenuItem value="popular">Popular</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* ==================== COLLAPSIBLE FILTER BAR ==================== */}
      {filtersVisible && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            px: 2,
            py: 0.8,
            overflowX: 'auto',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            '&::-webkit-scrollbar': { height: 3 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2 },
          }}
        >
          <FilterChip
            label="Machine type"
            value={filters.machineType || ''}
            options={filterOptions?.machineTypes ?? []}
            onChange={(v) => handleFilterChange('machineType', v)}
          />
          <FilterChip
            label="Manufacturer"
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
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                ml: 0.5,
                '&:hover': { color: 'rgba(255,255,255,0.7)' },
              }}
            >
              Clear all
            </Typography>
          )}
        </Box>
      )}

      {/* ==================== CONTENT (cards + side panel) ==================== */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Cards area */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {error && (
            <Alert severity="warning" sx={{ mx: 2, mt: 1, bgcolor: 'rgba(255,152,0,0.1)', color: '#ffb74d' }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              p: 2,
            }}
          >
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      flex: '1 0 280px',
                      maxWidth: 'calc(20% - 7px)',
                      height: 240,
                    }}
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
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={`more-${i}`}
                  variant="rounded"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    flex: '1 0 280px',
                    maxWidth: 'calc(20% - 7px)',
                    height: 240,
                  }}
                />
              ))}
          </Box>

          {!loading && hasMore && <Box ref={sentinelRef} sx={{ height: 20 }} />}
        </Box>

        {/* ==================== SIDE PANEL ==================== */}
        {selectedProduct && (
          <Box
            sx={{
              width: 300,
              flexShrink: 0,
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              bgcolor: '#1a1e2c',
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
            }}
          >
            <DetailPanel
              product={selectedProduct}
              isAuthenticated={isAuthenticated}
              onDownload={handleDownload}
              onTrial={handleTrial}
            />
          </Box>
        )}
      </Box>

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
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.08)',
        height: 28,
        px: 1,
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', mr: 0.5, whiteSpace: 'nowrap' }}>
        {label}:
      </Typography>
      <Select
        value={String(value)}
        onChange={(e) => onChange(e.target.value as string)}
        variant="standard"
        disableUnderline
        sx={{
          fontSize: '0.75rem',
          color: '#C0C4D0',
          minWidth: 30,
          '& .MuiSelect-select': { py: 0, pr: '18px !important', pl: 0.3 },
          '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.35)', fontSize: 16, right: 0 },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: '#1E2230',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              mt: 0.5,
              '& .MuiMenuItem-root': {
                fontSize: '0.75rem',
                color: '#C0C4D0',
                py: 0.6,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                '&.Mui-selected': { bgcolor: 'rgba(0,203,154,0.2)', color: '#fff' },
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

/* ─── Project Card ─── */

function ProjectCard({ product, selected, onClick }: { product: Product; selected?: boolean; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: '1 0 280px',
        maxWidth: 'calc(20% - 7px)',
        borderRadius: '12px',
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid',
        borderColor: selected ? '#00BCD4' : 'rgba(255,255,255,0.08)',
        boxShadow: selected ? '0 0 12px rgba(0,188,212,0.2)' : 'none',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: selected ? '#00BCD4' : 'rgba(255,255,255,0.15)',
        },
      }}
    >
      {/* Image area */}
      <Box
        sx={{
          height: 150,
          bgcolor: '#2a2d3a',
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
        {/* Owner badge */}
        {product.productOwner && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(18,105,217,0.85)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 500,
              px: 1,
              py: 0.3,
              borderRadius: '4px',
            }}
          >
            {product.productOwner}
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ py: 1 }}>
        {/* Title + subtitle */}
        <Box sx={{ px: 1.5 }}>
          <Typography
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}
          >
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.2 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              {product.machineType
                ? machineTypeLabels[product.machineType] || formatEnum(product.machineType)
                : '—'}
            </Typography>
            {product.numberOfAxes > 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                {product.numberOfAxes}X
              </Typography>
            )}
          </Box>
        </Box>

        {/* Divider */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.8 }} />

        {/* Footer: content type + downloads */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.7)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contentTypeLabels[product.contentType] || formatEnum(product.contentType)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DownloadIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              {product.downloadCount ?? 0}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Detail Side Panel ─── */

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
    <Box sx={{ p: 2 }}>
      {/* Name */}
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#F5F5F5', mb: 1 }}>
        {product.name}
      </Typography>

      {/* Badges */}
      <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: 'wrap' }}>
        <Chip
          label={contentTypeLabels[product.contentType] || formatEnum(product.contentType)}
          size="small"
          sx={{
            bgcolor: contentTypeColors[product.contentType] || '#1269D9',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 24,
            borderRadius: '6px',
          }}
        />
        <Chip
          label={formatEnum(product.category)}
          size="small"
          sx={{
            bgcolor: 'rgba(0,203,154,0.15)',
            color: '#00CB9A',
            fontWeight: 500,
            fontSize: '0.7rem',
            height: 24,
            borderRadius: '6px',
            border: '1px solid rgba(0,203,154,0.3)',
          }}
        />
      </Box>

      {/* Description */}
      {product.description && (
        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, mb: 1.5 }}>
          {product.description}
        </Typography>
      )}

      <SectionDivider />

      {/* PRICING & LICENSE */}
      <SectionTitle>PRICING & LICENSE</SectionTitle>
      <FieldRow>
        <Box sx={{ flex: 1 }}>
          <FieldLabel>Price</FieldLabel>
          <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#00CB9A', mb: 0.5 }}>
            {product.priceEur === 0 ? 'Free' : `${product.priceEur?.toFixed(2)} €`}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <FieldLabel>Trial Period</FieldLabel>
          <FieldValue>{product.trialDays > 0 ? `${product.trialDays} days` : '—'}</FieldValue>
        </Box>
      </FieldRow>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
        {product.trialDays > 0 && (
          <Button
            fullWidth
            variant="outlined"
            disabled={!isAuthenticated}
            startIcon={<TrialIcon sx={{ fontSize: '14px !important' }} />}
            onClick={onTrial}
            sx={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.8rem',
              fontWeight: 500,
              py: 0.8,
              borderRadius: '8px',
              '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.04)' },
              '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' },
            }}
          >
            Get Trial License
          </Button>
        )}
        <Button
          fullWidth
          variant="contained"
          startIcon={<DownloadIcon sx={{ fontSize: '14px !important' }} />}
          onClick={onDownload}
          sx={{
            bgcolor: '#1269D9',
            fontSize: '0.8rem',
            fontWeight: 500,
            py: 0.8,
            borderRadius: '8px',
            '&:hover': { bgcolor: '#0d4a97' },
          }}
        >
          Record Download
        </Button>
      </Box>

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
      {product.supportedCodes && (
        <Box sx={{ mt: 0.5 }}>
          <FieldLabel>Supported Codes</FieldLabel>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word', lineHeight: 1.5 }}>
            {product.supportedCodes}
          </Typography>
        </Box>
      )}

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
    </Box>
  );
}

/* ─── Detail Panel helpers ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#00CB9A', letterSpacing: 0.8, textTransform: 'uppercase', mt: 1.2, mb: 0.8 }}>
      {children}
    </Typography>
  );
}

function SectionDivider() {
  return <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mb: 0.2 }}>
      {children}
    </Typography>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: '0.82rem', color: '#F5F5F5', mb: 0.5, wordBreak: 'break-word' }}>
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
