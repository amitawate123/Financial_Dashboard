export const AMOUNT_SLIDER_MAX = 100000;
export const AMOUNT_SLIDER_STEP = 100;

export const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  type: '',
  categories: [],
  search: '',
  datePreset: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
};

export const DATE_PRESETS = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
];

export function datePresetToRange(preset) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const end = endDate.toISOString().slice(0, 10);

  if (preset === '7d') {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return { startDate: start.toISOString().slice(0, 10), endDate: end };
  }
  if (preset === '30d') {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return { startDate: start.toISOString().slice(0, 10), endDate: end };
  }
  if (preset === 'month') {
    const start = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    return { startDate: start.toISOString().slice(0, 10), endDate: end };
  }
  return { startDate: '', endDate: '' };
}

/** Build API query params from UI filter state */
export function filtersToParams(filters, { viewMode = 'table', currentDate } = {}) {
  const params = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.type) params.type = filters.type;
  if (filters.search) params.search = filters.search;
  if (filters.categories?.length) params.categories = filters.categories.join(',');

  if (filters.minAmount !== '' && filters.minAmount != null) params.minAmount = Number(filters.minAmount);
  if (filters.maxAmount !== '' && filters.maxAmount != null) params.maxAmount = Number(filters.maxAmount);

  if (viewMode === 'calendar' && currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    params.startDate = new Date(year, month, 1).toISOString().slice(0, 10);
    params.endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    params.page = 1;
    params.limit = 100;
  } else if (filters.datePreset) {
    const range = datePresetToRange(filters.datePreset);
    if (range.startDate) params.startDate = range.startDate;
    if (range.endDate) params.endDate = range.endDate;
  } else {
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }

  return params;
}

export function hasActiveFilters(filters) {
  return !!(
    filters.type ||
    filters.search ||
    filters.categories?.length ||
    filters.datePreset ||
    filters.startDate ||
    filters.endDate ||
    (filters.minAmount !== '' && filters.minAmount != null) ||
    (filters.maxAmount !== '' && filters.maxAmount != null)
  );
}

const fmtInr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function getFilterChips(filters, { viewMode } = {}) {
  const chips = [];

  if (filters.search) {
    chips.push({ key: 'search', label: `"${filters.search}"`, clear: { search: '' } });
  }
  if (filters.type) {
    chips.push({ key: 'type', label: filters.type, clear: { type: '' } });
  }
  filters.categories?.forEach((cat) => {
    chips.push({
      key: `cat-${cat}`,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      clear: { categories: filters.categories.filter((c) => c !== cat) },
    });
  });
  if (viewMode === 'table' && filters.datePreset) {
    const preset = DATE_PRESETS.find((p) => p.id === filters.datePreset);
    chips.push({
      key: 'datePreset',
      label: preset?.label || filters.datePreset,
      clear: { datePreset: '', startDate: '', endDate: '' },
    });
  }
  const hasMin = filters.minAmount !== '' && filters.minAmount != null;
  const hasMax = filters.maxAmount !== '' && filters.maxAmount != null;
  if (hasMin || hasMax) {
    const label = hasMin && hasMax
      ? `${fmtInr(filters.minAmount)} – ${fmtInr(filters.maxAmount)}`
      : hasMin
        ? `≥ ${fmtInr(filters.minAmount)}`
        : `≤ ${fmtInr(filters.maxAmount)}`;
    chips.push({ key: 'amount', label, clear: { minAmount: '', maxAmount: '' } });
  }

  return chips;
}
