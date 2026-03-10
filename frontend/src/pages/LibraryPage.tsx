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
      {/* ==================== TOP BAR (Figma node 3:25) ==================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          py: '20px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Filters pill button */}
        <Box
          onClick={() => setFiltersVisible((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: '19px',
            py: '7px',
            borderRadius: '16px',
            bgcolor: '#262830',
            border: '1px solid #3a3e46',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0,
            transition: 'all 0.15s',
            '&:hover': { borderColor: '#505460' },
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: '13.12px',
              lineHeight: '18.86px',
              color: '#c0c4d0',
              whiteSpace: 'nowrap',
            }}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Typography>
        </Box>

        {/* Content type pill tabs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '64px',
            p: '2px',
          }}
        >
          {contentTypeTabs.map((tab) => {
            const isActive = activeContentType === tab.value;
            return (
              <Box
                key={tab.value}
                onClick={() => setActiveContentType(tab.value)}
                sx={{
                  px: isActive ? '17px' : '16px',
                  py: isActive ? '3px' : '2px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s',
                  bgcolor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                  border: isActive ? '1px solid rgba(25,28,36,0.08)' : '1px solid transparent',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '24px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Recent sort pill */}
        <Box
          sx={{
            width: 103.875,
            height: 34,
            borderRadius: '16px',
            bgcolor: '#262830',
            border: '1px solid #3a3e46',
            flexShrink: 0,
            position: 'relative',
            cursor: 'pointer',
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
              position: 'absolute',
              inset: 0,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: '13.12px',
              lineHeight: '18.86px',
              color: '#c0c4d0',
              '& .MuiSelect-select': {
                py: 0,
                pl: '18px',
                pr: '32px !important',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiSelect-icon': { color: '#c0c4d0', fontSize: 18, right: 8 },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: '#262830',
                  border: '1px solid #3a3e46',
                  borderRadius: '10px',
                  mt: 0.5,
                  py: 0.5,
                  '& .MuiMenuItem-root': {
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '13.12px',
                    color: '#c0c4d0',
                    py: 1,
                    px: 2,
                    '&:hover': { bgcolor: '#2a2e38' },
                    '&.Mui-selected': {
                      bgcolor: 'transparent',
                      color: '#fff',
                      '&:hover': { bgcolor: '#2a2e38' },
                    },
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
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              bgcolor: 'rgba(255,255,255,0.08)',
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

/* ─── Project Card (pixel-perfect Figma match) ─── */
/*
 * Normal state  (node 18:524): border rgba(255,255,255,0.08), font-medium 500, no gradient, owner text transparent
 * Selected state (node 18:660): border #1269D9, font-bold 700 + tracking, blue gradient, owner text visible
 */

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
        borderColor: selected ? '#1269D9' : 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: selected ? '#1269D9' : 'rgba(255,255,255,0.15)',
        },
      }}
    >
      {/* Preview image */}
      <Box
        sx={{
          flex: '1 0 0',
          minHeight: 150,
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
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Blue gradient — only when selected */}
        {selected && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(18,105,217,0) 44%, rgba(18,105,217,0.8) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Owner badge — visible only when selected */}
        {product.productOwner && (
          <Typography
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              fontSize: '12px',
              lineHeight: '16px',
              color: selected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s',
            }}
          >
            {product.productOwner}
          </Typography>
        )}
      </Box>

      {/* Info section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', py: '8px', flexShrink: 0 }}>
        {/* Title + subtitle */}
        <Box sx={{ pl: '12px', pr: '8px' }}>
          {/* Title row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 24 }}>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: selected ? 700 : 500,
                fontSize: '16px',
                lineHeight: selected ? '22px' : '20px',
                letterSpacing: selected ? '0.375px' : 0,
                color: '#fff',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {product.name}
            </Typography>
          </Box>
          {/* Subtitle: machineType + axes */}
          <Box sx={{ display: 'flex', gap: '8px', mt: '2px' }}>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.6)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {product.machineType
                ? machineTypeLabels[product.machineType] || formatEnum(product.machineType)
                : '—'}
            </Typography>
            {product.numberOfAxes > 0 && (
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {product.numberOfAxes}X
              </Typography>
            )}
          </Box>
        </Box>

        {/* Divider line */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Footer: content type label + download icon + count */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: 24,
            px: '12px',
          }}
        >
          <Typography
            sx={{
              flex: 1,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
              color: 'rgba(255,255,255,0.8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contentTypeLabels[product.contentType] || formatEnum(product.contentType)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <DownloadIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'right',
              }}
            >
              {product.downloadCount ?? 0}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Detail Side Panel (pixel-perfect Figma node 45:400) ─── */

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', p: '16px' }}>
      {/* Title */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '16px',
          lineHeight: '22px',
          letterSpacing: '0.375px',
          color: '#fff',
        }}
      >
        {product.name}
      </Typography>

      {/* Badges */}
      <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Box
          sx={{
            bgcolor: '#1269D9',
            borderRadius: '6px',
            px: '8px',
            py: '4px',
          }}
        >
          <Typography sx={{ fontSize: '12px', lineHeight: '16px', color: '#fff', fontWeight: 400 }}>
            {contentTypeLabels[product.contentType] || formatEnum(product.contentType)}
          </Typography>
        </Box>
        <Box
          sx={{
            border: '1px solid #fff',
            borderRadius: '6px',
            px: '8px',
            py: '4px',
          }}
        >
          <Typography sx={{ fontSize: '11px', lineHeight: '16.5px', color: '#fff', fontWeight: 400 }}>
            {formatEnum(product.category)}
          </Typography>
        </Box>
      </Box>

      {/* Description */}
      <Typography sx={{ fontSize: '12px', lineHeight: '16px', color: '#fff', fontWeight: 400 }}>
        {product.description || '—'}
      </Typography>

      {/* Divider */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* PRICING & LICENSE */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography sx={sxSectionTitle}>Pricing & License</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Box>
            <Typography sx={sxFieldLabel}>Price</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#46acff' }}>
              {product.priceEur === 0 ? 'Free' : `${product.priceEur?.toFixed(2)} \u20AC`}
            </Typography>
          </Box>
          <Box>
            <Typography sx={sxFieldLabel}>Trial Period</Typography>
            <Typography sx={sxFieldValue}>{product.trialDays > 0 ? `${product.trialDays} days` : '\u2014'}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {product.trialDays > 0 && (
          <Button
            fullWidth
            variant="outlined"
            disabled={!isAuthenticated}
            startIcon={<TrialIcon sx={{ fontSize: '14px !important' }} />}
            onClick={onTrial}
            sx={{
              border: '0.667px solid #fff',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              lineHeight: '16px',
              px: '20px',
              py: '10px',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: '#fff' },
              '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.3)' },
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
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '16px',
            px: '20px',
            py: '10px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#0d4a97', boxShadow: 'none' },
          }}
        >
          Record Download
        </Button>
      </Box>

      {/* Divider */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* MACHINE INFORMATION */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography sx={sxSectionTitle}>Machine Information</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <FieldCell label="Manufacturer" value={product.machineManufacturer} />
          <FieldCell label="Machine Type" value={product.machineType ? machineTypeLabels[product.machineType] : undefined} />
          <FieldCell label="Series" value={product.machineSeries} />
          <FieldCell label="Model" value={product.machineModel} />
          <FieldCell label="Number of Axes" value={product.numberOfAxes > 0 ? String(product.numberOfAxes) : undefined} />
        </Box>
      </Box>

      {/* CONTROLLER */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography sx={sxSectionTitle}>Controller</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <FieldCell label="Manufacturer" value={product.controllerManufacturer} />
          <FieldCell label="Series" value={product.controllerSeries} />
          <FieldCell label="Model" value={product.controllerModel} />
        </Box>
      </Box>

      {/* SOFTWARE */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography sx={sxSectionTitle}>Software</Typography>
        <FieldCell label="Min Software Version" value={product.minSoftwareVersion} />
        {product.supportedCodes && (
          <Box>
            <Typography sx={sxFieldLabel}>Supported Codes</Typography>
            <Typography sx={{ ...sxFieldValue, wordBreak: 'break-word', whiteSpace: 'normal' }}>
              {product.supportedCodes}
            </Typography>
          </Box>
        )}
      </Box>

      {/* DETAILS */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography sx={sxSectionTitle}>Details</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <FieldCell label="Author" value={product.authorName} />
          <FieldCell label="Product Owner" value={product.productOwner} />
          <FieldCell label="Status" value={product.publicationStatus ? publicationStatusLabels[product.publicationStatus] : undefined} />
          <FieldCell label="Downloads" value={String(product.downloadCount ?? 0)} />
          <FieldCell label="Created" value={product.createdAt ? new Date(product.createdAt).toLocaleDateString() : undefined} />
          <FieldCell label="Updated" value={product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : undefined} />
          <FieldCell label="Published" value={product.publishedAt ? new Date(product.publishedAt).toLocaleDateString() : undefined} />
          <FieldCell label="Experience" value={product.experienceStatus === ExperienceStatus.VERIFIED_ON_EQUIPMENT ? 'Verified' : 'Not tested'} />
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Side panel design tokens (Figma 45:400) ─── */

const sxSectionTitle = {
  fontWeight: 700,
  fontSize: '10px',
  lineHeight: '14px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#46acff',
};

const sxFieldLabel = {
  fontWeight: 400,
  fontSize: '10px',
  lineHeight: '14px',
  color: 'rgba(255,255,255,0.5)',
};

const sxFieldValue = {
  fontWeight: 500,
  fontSize: '12px',
  lineHeight: '16px',
  color: '#fff',
  whiteSpace: 'nowrap' as const,
};

function FieldCell({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography sx={sxFieldLabel}>{label}</Typography>
      <Typography sx={sxFieldValue}>{value || '\u2014'}</Typography>
    </Box>
  );
}
