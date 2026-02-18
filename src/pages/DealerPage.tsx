import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { Product } from '../types';
import {
  ContentType,
  ContentCategory,
  MachineType,
  Visibility,
  ExperienceStatus,
  PublicationStatus,
  contentTypeLabels,
  categoryLabels,
  machineTypeLabels,
  publicationStatusLabels,
  statusColors,
  contentTypeColors,
} from '../types';
import { productsApi } from '../services/api';

const steps = ['Основные данные', 'Параметры станка', 'Цена и контент'];

const emptyForm: Partial<Product> = {
  name: '',
  contentType: ContentType.POST_PROCESSOR,
  category: ContentCategory.CNC_MACHINES,
  description: '',
  kitContents: '',
  minSoftwareVersion: '',
  machineManufacturer: '',
  machineSeries: '',
  machineModel: '',
  machineType: MachineType.MILLING,
  numberOfAxes: 3,
  controllerManufacturer: '',
  controllerSeries: '',
  controllerModel: '',
  priceEur: 0,
  productOwner: '',
  authorName: '',
  trialDays: 30,
  supportedCodes: '',
  sampleOutputCode: '',
  imageUrl: '',
  visibility: Visibility.PUBLIC,
  experienceStatus: ExperienceStatus.NOT_TESTED,
};

export default function DealerPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<Partial<Product>>(emptyForm);
  const [activeStep, setActiveStep] = useState(0);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const fetchMyProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await productsApi.getMyProducts();
      setMyProducts(data);
    } catch {
      try {
        const allData = await productsApi.getAll();
        setMyProducts(allData);
      } catch {
        setSnackbar({ open: true, message: 'Ошибка загрузки продуктов', severity: 'error' });
      }
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleChange = (field: keyof Product, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (asDraft: boolean) => {
    try {
      const payload = {
        ...form,
        publicationStatus: asDraft ? PublicationStatus.DRAFT : PublicationStatus.PENDING_REVIEW,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        setSnackbar({
          open: true,
          message: 'Продукт обновлён!',
          severity: 'success',
        });
      } else {
        await productsApi.create(payload);
        setSnackbar({
          open: true,
          message: asDraft
            ? 'Продукт сохранён как черновик!'
            : 'Продукт отправлен на модерацию!',
          severity: 'success',
        });
      }
      setForm(emptyForm);
      setActiveStep(0);
      setEditingProduct(null);
      setActiveTab(0);
      fetchMyProducts();
    } catch {
      setSnackbar({ open: true, message: 'Ошибка сохранения', severity: 'error' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      contentType: product.contentType,
      category: product.category,
      description: product.description,
      kitContents: product.kitContents,
      minSoftwareVersion: product.minSoftwareVersion,
      machineManufacturer: product.machineManufacturer,
      machineSeries: product.machineSeries,
      machineModel: product.machineModel,
      machineType: product.machineType,
      numberOfAxes: product.numberOfAxes,
      controllerManufacturer: product.controllerManufacturer,
      controllerSeries: product.controllerSeries,
      controllerModel: product.controllerModel,
      priceEur: product.priceEur,
      productOwner: product.productOwner,
      authorName: product.authorName,
      trialDays: product.trialDays,
      supportedCodes: product.supportedCodes,
      sampleOutputCode: product.sampleOutputCode,
      imageUrl: product.imageUrl,
      visibility: product.visibility,
      experienceStatus: product.experienceStatus,
    });
    setActiveStep(0);
    setActiveTab(1);
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    try {
      await productsApi.delete(deleteDialog.product.id);
      setSnackbar({ open: true, message: 'Продукт удалён', severity: 'success' });
      setDeleteDialog({ open: false, product: null });
      fetchMyProducts();
    } catch {
      setSnackbar({ open: true, message: 'Ошибка удаления', severity: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setActiveStep(0);
  };

  const statusCounts = {
    all: myProducts.length,
    draft: myProducts.filter((p) => p.publicationStatus === PublicationStatus.DRAFT).length,
    pending: myProducts.filter((p) => p.publicationStatus === PublicationStatus.PENDING_REVIEW).length,
    published: myProducts.filter((p) => p.publicationStatus === PublicationStatus.PUBLISHED).length,
    rejected: myProducts.filter((p) => p.publicationStatus === PublicationStatus.REJECTED).length,
  };

  const renderStep0 = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Название продукта"
          fullWidth
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Digital Machine Kit for Haas VF-2"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth>
          <InputLabel>Тип контента</InputLabel>
          <Select
            value={form.contentType}
            label="Тип контента"
            onChange={(e) => handleChange('contentType', e.target.value)}
          >
            {Object.values(ContentType).map((ct) => (
              <MenuItem key={ct} value={ct}>{contentTypeLabels[ct]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth>
          <InputLabel>Категория</InputLabel>
          <Select
            value={form.category}
            label="Категория"
            onChange={(e) => handleChange('category', e.target.value)}
          >
            {Object.values(ContentCategory).map((cat) => (
              <MenuItem key={cat} value={cat}>{categoryLabels[cat]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Описание"
          fullWidth
          multiline
          rows={4}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Состав комплекта"
          fullWidth
          multiline
          rows={3}
          value={form.kitContents}
          onChange={(e) => handleChange('kitContents', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Автор"
          fullWidth
          value={form.authorName}
          onChange={(e) => handleChange('authorName', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Владелец"
          fullWidth
          value={form.productOwner}
          onChange={(e) => handleChange('productOwner', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderStep1 = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Производитель станка"
          fullWidth
          value={form.machineManufacturer}
          onChange={(e) => handleChange('machineManufacturer', e.target.value)}
          placeholder="e.g. Haas, DMG Mori, Fanuc"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth>
          <InputLabel>Тип станка</InputLabel>
          <Select
            value={form.machineType}
            label="Тип станка"
            onChange={(e) => handleChange('machineType', e.target.value)}
          >
            {Object.values(MachineType).map((mt) => (
              <MenuItem key={mt} value={mt}>{machineTypeLabels[mt]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Серия станка"
          fullWidth
          value={form.machineSeries}
          onChange={(e) => handleChange('machineSeries', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Модель станка"
          fullWidth
          value={form.machineModel}
          onChange={(e) => handleChange('machineModel', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          label="Количество осей"
          type="number"
          fullWidth
          value={form.numberOfAxes}
          onChange={(e) => handleChange('numberOfAxes', parseInt(e.target.value) || 0)}
          inputProps={{ min: 1, max: 12 }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          label="Производитель ЧПУ"
          fullWidth
          value={form.controllerManufacturer}
          onChange={(e) => handleChange('controllerManufacturer', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          label="Серия ЧПУ"
          fullWidth
          value={form.controllerSeries}
          onChange={(e) => handleChange('controllerSeries', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Модель ЧПУ"
          fullWidth
          value={form.controllerModel}
          onChange={(e) => handleChange('controllerModel', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Мин. версия ПО"
          fullWidth
          value={form.minSoftwareVersion}
          onChange={(e) => handleChange('minSoftwareVersion', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth>
          <InputLabel>Статус проверки</InputLabel>
          <Select
            value={form.experienceStatus}
            label="Статус проверки"
            onChange={(e) => handleChange('experienceStatus', e.target.value)}
          >
            <MenuItem value={ExperienceStatus.NOT_TESTED}>Не проверено</MenuItem>
            <MenuItem value={ExperienceStatus.VERIFIED_ON_EQUIPMENT}>Проверено на оборудовании</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth>
          <InputLabel>Видимость</InputLabel>
          <Select
            value={form.visibility}
            label="Видимость"
            onChange={(e) => handleChange('visibility', e.target.value)}
          >
            {Object.values(Visibility).map((v) => (
              <MenuItem key={v} value={v}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderStep2 = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Цена (EUR)"
          type="number"
          fullWidth
          value={form.priceEur}
          onChange={(e) => handleChange('priceEur', parseFloat(e.target.value) || 0)}
          InputProps={{
            startAdornment: <InputAdornment position="start">€</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Пробный период (дней)"
          type="number"
          fullWidth
          value={form.trialDays}
          onChange={(e) => handleChange('trialDays', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="URL изображения"
          fullWidth
          value={form.imageUrl}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Поддерживаемые коды"
          fullWidth
          value={form.supportedCodes}
          onChange={(e) => handleChange('supportedCodes', e.target.value)}
          placeholder="G00, G01, G02, G03, M03, M05..."
          helperText="Через запятую"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Пример выходного кода"
          fullWidth
          multiline
          rows={8}
          value={form.sampleOutputCode}
          onChange={(e) => handleChange('sampleOutputCode', e.target.value)}
          InputProps={{
            sx: { fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.85rem' },
          }}
        />
      </Grid>
    </Grid>
  );

  const renderMyProducts = () => (
    <Box>
      {/* Stats bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Всего', count: statusCounts.all, color: '#90caf9' },
          { label: 'Черновики', count: statusCounts.draft, color: statusColors[PublicationStatus.DRAFT] },
          { label: 'На модерации', count: statusCounts.pending, color: statusColors[PublicationStatus.PENDING_REVIEW] },
          { label: 'Опубликовано', count: statusCounts.published, color: statusColors[PublicationStatus.PUBLISHED] },
          { label: 'Отклонено', count: statusCounts.rejected, color: statusColors[PublicationStatus.REJECTED] },
        ].map((s) => (
          <Paper
            key={s.label}
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 100,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>
              {s.count}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(245,245,245,0.5)' }}>
              {s.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {loadingProducts ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={72} />
          ))}
        </Box>
      ) : myProducts.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            У вас пока нет продуктов
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setActiveTab(1)}
            sx={{ bgcolor: '#00CB9A', '&:hover': { bgcolor: '#00b388' } }}
          >
            Создать первый продукт
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {myProducts.map((product) => (
            <Paper
              key={product.id}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'rgba(255,255,255,0.15)' },
              }}
            >
              {/* Type badge */}
              <Chip
                label={contentTypeLabels[product.contentType]}
                size="small"
                sx={{
                  bgcolor: contentTypeColors[product.contentType] + '18',
                  color: contentTypeColors[product.contentType],
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  minWidth: 120,
                }}
              />

              {/* Name and info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {product.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {product.machineManufacturer}
                  {product.machineModel ? ` ${product.machineModel}` : ''}
                  {product.controllerManufacturer ? ` · ${product.controllerManufacturer}` : ''}
                </Typography>
              </Box>

              {/* Price */}
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: product.priceEur > 0 ? '#90caf9' : 'text.secondary',
                  minWidth: 60,
                  textAlign: 'right',
                }}
              >
                {product.priceEur > 0 ? `€${product.priceEur}` : 'Free'}
              </Typography>

              {/* Status */}
              <Chip
                label={publicationStatusLabels[product.publicationStatus]}
                size="small"
                sx={{
                  bgcolor: statusColors[product.publicationStatus] + '18',
                  color: statusColors[product.publicationStatus],
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  minWidth: 95,
                }}
              />

              {/* Date */}
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 75 }}>
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString()
                  : product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString()
                  : '—'}
              </Typography>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Редактировать">
                  <IconButton size="small" onClick={() => handleEdit(product)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, product })}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );

  const renderForm = () => (
    <Box>
      {editingProduct && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={handleCancelEdit}>
              Отменить
            </Button>
          }
        >
          Редактирование: <strong>{editingProduct.name}</strong>
        </Alert>
      )}

      {/* Step indicators */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {steps.map((label, idx) => (
          <Box
            key={label}
            onClick={() => setActiveStep(idx)}
            sx={{
              flex: 1,
              py: 1,
              px: 2,
              cursor: 'pointer',
              borderRadius: 1,
              textAlign: 'center',
              bgcolor:
                idx === activeStep
                  ? 'rgba(0,203,154,0.12)'
                  : 'rgba(255,255,255,0.03)',
              border:
                idx === activeStep
                  ? '1px solid rgba(0,203,154,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: idx === activeStep ? '#00CB9A' : 'rgba(245,245,245,0.5)',
              }}
            >
              {idx + 1}. {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Form content */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {activeStep === 0 && renderStep0()}
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
      </Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          disabled={activeStep === 0}
          startIcon={<BackIcon />}
          onClick={() => setActiveStep((prev) => prev - 1)}
        >
          Назад
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === steps.length - 1 ? (
            <>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => handleSubmit(true)}
              >
                Сохранить как черновик
              </Button>
              <Button
                variant="contained"
                startIcon={<PublishIcon />}
                onClick={() => handleSubmit(false)}
                sx={{ bgcolor: '#00CB9A', '&:hover': { bgcolor: '#00b388' } }}
              >
                Отправить на модерацию
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              endIcon={<NextIcon />}
              onClick={() => setActiveStep((prev) => prev + 1)}
              sx={{ bgcolor: '#1269D9', '&:hover': { bgcolor: '#0d4a97' } }}
            >
              Далее
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Панель дилера
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
            Управление вашими станками и постами
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchMyProducts}
            sx={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(245,245,245,0.6)' }}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              handleCancelEdit();
              setActiveTab(1);
            }}
            sx={{ bgcolor: '#00CB9A', '&:hover': { bgcolor: '#00b388' } }}
          >
            Создать
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
        }}
      >
        <Tab
          label={
            <Badge badgeContent={myProducts.length} color="primary" max={999}>
              <Box sx={{ pr: 2 }}>Мои продукты</Box>
            </Badge>
          }
        />
        <Tab label={editingProduct ? 'Редактирование' : 'Создать новый'} />
      </Tabs>

      {/* Content */}
      {activeTab === 0 ? renderMyProducts() : renderForm()}

      {/* Delete dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить <strong>{deleteDialog.product?.name}</strong>?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>
            Отмена
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Удалить
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
