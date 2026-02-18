import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  Divider,
  Skeleton,
  Chip,
} from '@mui/material';
import { FilterAlt as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  ContentType,
  ContentCategory,
  MachineType,
  contentTypeLabels,
  categoryLabels,
  machineTypeLabels,
} from '../types';
import type { FilterOptions, SearchRequest } from '../types';
import { productsApi } from '../services/api';

interface SearchFiltersProps {
  filters: SearchRequest;
  onFilterChange: (filters: SearchRequest) => void;
}

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi
      .getFilters()
      .then(setFilterOptions)
      .catch(() => {
        setFilterOptions({
          machineManufacturers: [],
          controllerManufacturers: [],
          contentOwners: [],
          numberOfAxes: [],
          contentTypes: [],
          machineTypes: [],
          categories: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof SearchRequest, value: unknown) => {
    onFilterChange({ ...filters, [field]: value || undefined, page: 0 });
  };

  const handleClear = () => {
    onFilterChange({ page: 0, size: filters.size });
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

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={56} sx={{ mb: 2 }} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        position: 'sticky',
        top: 80,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{ height: 22, fontSize: '0.75rem' }}
            />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button size="small" startIcon={<ClearIcon />} onClick={handleClear}>
            Clear
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Content Type */}
      <FormControl fullWidth sx={{ mb: 2.5 }}>
        <InputLabel>Content Type</InputLabel>
        <Select
          value={filters.contentType || ''}
          label="Content Type"
          onChange={(e) => handleChange('contentType', e.target.value)}
        >
          <MenuItem value="">All Types</MenuItem>
          {Object.values(ContentType).map((ct) => (
            <MenuItem key={ct} value={ct}>
              {contentTypeLabels[ct]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Category */}
      <FormControl fullWidth sx={{ mb: 2.5 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={filters.category || ''}
          label="Category"
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <MenuItem value="">All Categories</MenuItem>
          {Object.values(ContentCategory).map((cat) => (
            <MenuItem key={cat} value={cat}>
              {categoryLabels[cat]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Machine Manufacturer */}
      <FormControl fullWidth sx={{ mb: 2.5 }}>
        <InputLabel>Machine Manufacturer</InputLabel>
        <Select
          value={filters.machineManufacturer || ''}
          label="Machine Manufacturer"
          onChange={(e) => handleChange('machineManufacturer', e.target.value)}
        >
          <MenuItem value="">All Manufacturers</MenuItem>
          {(filterOptions?.machineManufacturers ?? []).map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Controller Manufacturer */}
      <FormControl fullWidth sx={{ mb: 2.5 }}>
        <InputLabel>Controller Manufacturer</InputLabel>
        <Select
          value={filters.controllerManufacturer || ''}
          label="Controller Manufacturer"
          onChange={(e) => handleChange('controllerManufacturer', e.target.value)}
        >
          <MenuItem value="">All Controllers</MenuItem>
          {(filterOptions?.controllerManufacturers ?? []).map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Machine Type */}
      <FormControl fullWidth sx={{ mb: 2.5 }}>
        <InputLabel>Machine Type</InputLabel>
        <Select
          value={filters.machineType || ''}
          label="Machine Type"
          onChange={(e) => handleChange('machineType', e.target.value)}
        >
          <MenuItem value="">All Machine Types</MenuItem>
          {Object.values(MachineType).map((mt) => (
            <MenuItem key={mt} value={mt}>
              {machineTypeLabels[mt]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Number of Axes */}
      <FormControl fullWidth sx={{ mb: 2.5 }}>
        <InputLabel>Number of Axes</InputLabel>
        <Select
          value={filters.numberOfAxes ?? ''}
          label="Number of Axes"
          onChange={(e) => handleChange('numberOfAxes', e.target.value)}
        >
          <MenuItem value="">Any</MenuItem>
          {(filterOptions?.numberOfAxes ?? []).map((n) => (
            <MenuItem key={n} value={n}>
              {n} axes
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Content Owner */}
      <FormControl fullWidth>
        <InputLabel>Content Owner</InputLabel>
        <Select
          value={filters.contentOwner || ''}
          label="Content Owner"
          onChange={(e) => handleChange('contentOwner', e.target.value)}
        >
          <MenuItem value="">All Owners</MenuItem>
          {(filterOptions?.contentOwners ?? []).map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
}
