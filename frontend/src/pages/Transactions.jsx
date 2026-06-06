import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Upload, FileText, Paperclip, Download, Eye, Calendar, Table, ChevronLeft, ChevronRight, FileSpreadsheet, FileType, FileUp } from 'lucide-react';
import { transactionsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTransactionUpdates } from '../hooks/useTransactionUpdates';
import { Card, Button, Input, Select, Badge, Modal, Alert, Spinner, Empty, Pagination } from '../components/ui';
import TransactionFilters from '../components/TransactionFilters';
import ImportTransactionsModal from '../components/ImportTransactionsModal';
import { DEFAULT_FILTERS, filtersToParams } from '../utils/transactionFilters';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const CATEGORIES = ['salary','freelance','investment','business','food','transport','housing','utilities','healthcare','entertainment','education','shopping','other'];

const EMPTY_FORM = { amount: '', type: 'expense', category: 'food', date: '', notes: '' };

function TransactionForm({ initial, onSave, onClose }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Alert type="error" message={error} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Amount (₹)" type="number" step="0.01" min="0.01" value={form.amount} onChange={set('amount')} required />
        <Select label="Type" value={form.type} onChange={set('type')}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Select label="Category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Input label="Date" type="date" value={form.date ? form.date.slice(0,10) : ''} onChange={set('date')} />
      </div>
      <Input label="Notes (optional)" value={form.notes} onChange={set('notes')} placeholder="Add a note…" />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save changes' : 'Create transaction'}</Button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const { user, can } = useAuth();
  const [data, setData]         = useState({ transactions: [], pagination: {} });
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ ...DEFAULT_FILTERS });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [filesTx, setFilesTx] = useState(null);
  const [fileLoading, setFileLoading] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const uploadTxRef = useRef(null);

  const [viewMode, setViewMode] = useState('table');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [exportModal, setExportModal] = useState(null);
  const [importModal, setImportModal] = useState(false);

  const canManage = (tx) => {
    if (can(['admin'])) return true;
    const ownerId = tx.createdBy?._id || tx.createdBy;
    return ownerId?.toString() === user?._id?.toString();
  };

  const getExportBaseParams = () => {
    const params = filtersToParams(filters, { viewMode, currentDate });
    delete params.page;
    delete params.limit;
    return params;
  };

  const runExport = async (scope) => {
    const format = exportModal;
    setExportModal(null);
    setExporting(format);
    setUploadError('');
    try {
      const params = { ...getExportBaseParams(), exportScope: scope };
      if (scope === 'page') {
        params.page = viewMode === 'table' ? filters.page : 1;
        params.limit = viewMode === 'table' ? filters.limit : 100;
      }
      const exporters = {
        csv: transactionsAPI.exportCsv,
        excel: transactionsAPI.exportExcel,
        pdf: transactionsAPI.exportPdf,
      };
      await exporters[format](params);
    } catch (err) {
      setUploadError(err.response?.data?.message || `Failed to export ${format.toUpperCase()}.`);
    } finally {
      setExporting(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtersToParams(filters, { viewMode, currentDate });
      const res = await transactionsAPI.list(params);
      const { pagination: p } = res.data;
      if (viewMode === 'table' && p.pages > 0 && filters.page > p.pages) {
        setFilters((f) => ({ ...f, page: p.pages }));
        return;
      }
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters, viewMode, currentDate]);

  useEffect(() => { load(); }, [load]);

  useTransactionUpdates(load);

  const handleCreate = async (form) => {
    await transactionsAPI.create(form);
    load();
  };

  const handleUpdate = async (form) => {
    await transactionsAPI.update(editing._id, form);
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionsAPI.delete(deleteId);
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const openUpload = (txId) => {
    uploadTxRef.current = txId;
    setUploadError('');
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const txId = uploadTxRef.current;
    if (!file || !txId) return;

    setUploadingId(txId);
    setUploadError('');
    try {
      await transactionsAPI.uploadFile(txId, file);
      load();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setUploadingId(null);
      uploadTxRef.current = null;
    }
  };

  const openFile = async (txId, attachment, mode = 'view') => {
    const key = `${txId}-${attachment.fileId}`;
    setFileLoading(key);
    try {
      const res = await transactionsAPI.downloadFile(txId, attachment.fileId);
      const blob = res.data;
      const url = URL.createObjectURL(blob);

      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.originalName;
        a.click();
        URL.revokeObjectURL(url);
      } else if (attachment.mimeType.startsWith('image/')) {
        setPreview({ url, name: attachment.originalName, mimeType: attachment.mimeType });
      } else {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to open file.');
    } finally {
      setFileLoading(null);
    }
  };

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleDeleteFile = async (txId, fileId) => {
    setFileLoading(`${txId}-${fileId}`);
    try {
      await transactionsAPI.deleteFile(txId, fileId);
      setFilesTx((tx) => {
        if (!tx) return null;
        const attachments = tx.attachments.filter((a) => a.fileId.toString() !== fileId.toString());
        if (attachments.length === 0) return null;
        return { ...tx, attachments };
      });
      load();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setFileLoading(null);
    }
  };

  // --- CALENDAR LOGIC GENERATION ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonthMatrix = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const matrix = [];
    for (let i = 0; i < firstDayIndex; i++) matrix.push(null);
    for (let day = 1; day <= totalDays; day++) matrix.push(new Date(year, month, day));
    while (matrix.length % 7 !== 0) matrix.push(null);
    return matrix;
  };

  const getTransactionsForDate = (date) => {
    if (!date) return [];
    return data.transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          txDate.getDate() === date.getDate() &&
          txDate.getMonth() === date.getMonth() &&
          txDate.getFullYear() === date.getFullYear()
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date) || b.amount - a.amount);
  };

  const { transactions, pagination } = data;
  const totalMatching = pagination.total ?? transactions.length;
  const currentPageCount = transactions.length;

  const monthStats = (() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  })();

  const selectedDayTx = selectedDay ? getTransactionsForDate(selectedDay) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Transactions</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            {viewMode === 'table' && pagination.total !== undefined ? `${pagination.total} records` : 'Calendar View'}
          </p>
        </div>
        
        {/* View Toggle Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 2 }}>
            <button
              onClick={() => { setViewMode('table'); setSelectedDay(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', padding: '6px 12px', fontSize: 13, fontWeight: 500, borderRadius: 'calc(var(--radius) - 2px)', cursor: 'pointer', background: viewMode === 'table' ? 'var(--accent-bg)' : 'transparent', color: viewMode === 'table' ? 'var(--accent)' : 'var(--text-3)' }}
            >
              <Table size={14} /> Table
            </button>
            <button
              onClick={() => { setViewMode('calendar'); setSelectedDay(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', padding: '6px 12px', fontSize: 13, fontWeight: 500, borderRadius: 'calc(var(--radius) - 2px)', cursor: 'pointer', background: viewMode === 'calendar' ? 'var(--accent-bg)' : 'transparent', color: viewMode === 'calendar' ? 'var(--accent)' : 'var(--text-3)' }}
            >
              <Calendar size={14} /> Calendar
            </button>
          </div>

          <Button variant="secondary" onClick={() => setImportModal(true)}>
            <FileUp size={15} /> Import Excel
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} /> New transaction
          </Button>
        </div>
      </div>

      <Alert type="error" message={uploadError} />

      <TransactionFilters
        filters={filters}
        onChange={(next) => setFilters(typeof next === 'function' ? next : { ...next, page: 1 })}
        categories={CATEGORIES}
        viewMode={viewMode}
        exportSection={(
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginRight: 4 }}>Generate</span>
            {[
              { key: 'csv', label: 'CSV', icon: FileType },
              { key: 'excel', label: 'Excel', icon: FileSpreadsheet },
              { key: 'pdf', label: 'PDF', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                disabled={!!exporting}
                onClick={() => setExportModal(key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: exporting === key ? 'var(--accent-bg)' : 'var(--surface)',
                  color: exporting === key ? 'var(--accent)' : 'var(--text-2)',
                  cursor: exporting ? 'wait' : 'pointer',
                }}
              >
                <Icon size={14} />
                {exporting === key ? 'Generating…' : label}
              </button>
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
              Uses current filters
            </span>
          </div>
        )}
      />

      {/* Main Content Render Layout */}
      {loading ? (
        <Card><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={24} /></div></Card>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW MODE */
        <Card>
          {transactions.length === 0 ? (
            <Empty
              icon={FileText}
              title="No transactions on this page"
              message={
                pagination.pages > 1
                  ? 'Use pagination below to go to another page, or adjust your filters.'
                  : 'Try adjusting your filters or create a new transaction.'
              }
            />
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Date','Category','Type','Amount','Notes','Created by',''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={tx._id} style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmtDate(tx.date)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{tx.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={tx.type === 'income' ? 'green' : 'red'}>{tx.type}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, fontFamily: 'var(--mono)', whiteSpace: 'nowrap', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.notes || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)' }}>{tx.createdBy?.name || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {tx.attachments?.length > 0 && (
                              <button
                                onClick={() => setFilesTx(tx)}
                                title={`${tx.attachments.length} file(s)`}
                                style={{ padding: '5px 7px', borderRadius: 6, color: 'var(--accent)', background: 'var(--accent-bg)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, transition: 'all var(--transition)' }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                <Paperclip size={14} />
                                {tx.attachments.length}
                              </button>
                            )}
                            {canManage(tx) && (
                              <>
                                <button onClick={() => openEdit(tx)} style={{ padding: '5px', borderRadius: 6, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'all var(--transition)' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setDeleteId(tx._id)} style={{ padding: '5px', borderRadius: 6, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'all var(--transition)' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                                  <Trash2 size={14} />
                                </button>
                                <button
                                  onClick={() => openUpload(tx._id)}
                                  disabled={uploadingId === tx._id}
                                  title={tx.attachments?.length ? `${tx.attachments.length} file(s) attached` : 'Upload file'}
                                  style={{ padding: '5px', borderRadius: 6, color: tx.attachments?.length ? 'var(--accent)' : 'var(--text-3)', background: 'none', border: 'none', cursor: uploadingId === tx._id ? 'wait' : 'pointer', transition: 'all var(--transition)', opacity: uploadingId === tx._id ? 0.5 : 1 }}
                                  onMouseEnter={e => { if (uploadingId !== tx._id) { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = tx.attachments?.length ? 'var(--accent)' : 'var(--text-3)'; }}>
                                  <Upload size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          )}

          {pagination.pages > 1 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          )}
        </Card>
      ) : (
        /* CALENDAR VIEW MODE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="secondary" size="sm" onClick={() => { handlePrevMonth(); setSelectedDay(null); }} style={{ padding: '6px 8px' }}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(null); }} style={{ fontSize: 12 }}>
                Today
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { handleNextMonth(); setSelectedDay(null); }} style={{ padding: '6px 8px' }}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Card style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Month income</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{fmt(monthStats.income)}</p>
            </Card>
            <Card style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Month expense</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{fmt(monthStats.expense)}</p>
            </Card>
            <Card style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Net</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: monthStats.net >= 0 ? 'var(--accent)' : 'var(--red)' }}>{fmt(monthStats.net)}</p>
            </Card>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* Days of week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textAlign: 'center' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', background: 'var(--border)', gap: '1px' }}>
              {getDaysInMonthMatrix().map((date, index) => {
                const dayTx = getTransactionsForDate(date);
                const isToday = date && new Date().toDateString() === date.toDateString();

                const isSelected =
                  selectedDay &&
                  date &&
                  selectedDay.toDateString() === date.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => date && setSelectedDay(date)}
                    style={{
                      minHeight: '112px',
                      background: date ? 'var(--surface)' : 'var(--bg)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      cursor: date ? 'pointer' : 'default',
                      outline: isSelected ? '2px solid var(--accent)' : 'none',
                      outlineOffset: -2,
                    }}
                  >
                    {date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: isToday ? 700 : 500,
                            color: isToday ? 'var(--accent)' : 'var(--text-2)',
                            background: isToday ? 'var(--accent-bg)' : 'transparent',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {date.getDate()}
                        </span>
                        {dayTx.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)' }}>{dayTx.length}</span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', maxHeight: '76px' }}>
                      {dayTx.slice(0, 3).map((tx) => (
                        <div
                          key={tx._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canManage(tx)) openEdit(tx);
                            else setSelectedDay(date);
                          }}
                          title={`${tx.category}: ${fmt(tx.amount)}${tx.notes ? ` (${tx.notes})` : ''}`}
                          style={{
                            padding: '3px 6px',
                            borderRadius: 'var(--radius)',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            background: tx.type === 'income' ? 'var(--green-bg)' : 'var(--red-bg)',
                            color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                            borderLeft: `3px solid ${tx.type === 'income' ? 'var(--green)' : 'var(--red)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 4,
                          }}
                        >
                          <span style={{ textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.category}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, flexShrink: 0 }}>{fmt(tx.amount)}</span>
                        </div>
                      ))}
                      {dayTx.length > 3 && (
                        <span style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 4 }}>+{dayTx.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {selectedDay && (
            <Card>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(selectedDay)}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {selectedDayTx.length} transaction{selectedDayTx.length !== 1 ? 's' : ''} · sorted by date
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>Close</Button>
              </div>
              {selectedDayTx.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>No transactions on this day</div>
              ) : (
                <div>
                  {selectedDayTx.map((tx, i) => (
                    <div
                      key={tx._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 20px',
                        borderBottom: i < selectedDayTx.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: canManage(tx) ? 'pointer' : 'default',
                      }}
                      onClick={() => canManage(tx) && openEdit(tx)}
                      onMouseEnter={(e) => { if (canManage(tx)) e.currentTarget.style.background = 'var(--bg)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <Badge color={tx.type === 'income' ? 'green' : 'red'}>{tx.type}</Badge>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{tx.category}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes || '—'}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--mono)', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Export scope modal */}
      <Modal
        open={!!exportModal}
        onClose={() => setExportModal(null)}
        title={`Export as ${exportModal?.toUpperCase()}`}
      >
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>
          Choose which records to include in your file.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => runExport('all')}
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>All matching data</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Every record that matches your filters
              {totalMatching !== undefined ? ` · ${totalMatching} total` : ''}
            </p>
          </button>
          <button
            type="button"
            onClick={() => runExport('page')}
            disabled={currentPageCount === 0}
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              cursor: currentPageCount === 0 ? 'not-allowed' : 'pointer',
              opacity: currentPageCount === 0 ? 0.5 : 1,
              transition: 'all var(--transition)',
            }}
            onMouseEnter={(e) => {
              if (currentPageCount > 0) {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-bg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--surface)';
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {viewMode === 'table' ? `Current page only (page ${pagination.page || 1})` : 'Current calendar view'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {viewMode === 'table'
                ? `Only the ${currentPageCount} row(s) shown on this page`
                : `Only the ${currentPageCount} transaction(s) loaded in the calendar`}
            </p>
          </button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setExportModal(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit transaction' : 'New transaction'}>
        <TransactionForm
          initial={editing}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={closeModal}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete transaction">
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Files Modal */}
      <Modal open={!!filesTx} onClose={() => setFilesTx(null)} title="Attached files">
        {filesTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
              {fmtDate(filesTx.date)} · {filesTx.category} · {fmt(filesTx.amount)}
            </p>
            {filesTx.attachments.map((file) => {
              const key = `${filesTx._id}-${file.fileId}`;
              const loading = fileLoading === key;
              return (
                <div
                  key={file.fileId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)',
                  }}
                >
                  <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.originalName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtSize(file.size)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => openFile(filesTx._id, file, 'view')}
                      disabled={loading}
                      title="View"
                      style={{ padding: 5, borderRadius: 6, border: 'none', background: 'none', color: 'var(--text-3)', cursor: loading ? 'wait' : 'pointer' }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => openFile(filesTx._id, file, 'download')}
                      disabled={loading}
                      title="Download"
                      style={{ padding: 5, borderRadius: 6, border: 'none', background: 'none', color: 'var(--text-3)', cursor: loading ? 'wait' : 'pointer' }}
                    >
                      <Download size={14} />
                    </button>
                    {can(['admin']) && (
                      <button
                        onClick={() => handleDeleteFile(filesTx._id, file.fileId)}
                        disabled={loading}
                        title="Delete file"
                        style={{ padding: 5, borderRadius: 6, border: 'none', background: 'none', color: 'var(--text-3)', cursor: loading ? 'wait' : 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal open={!!preview} onClose={closePreview} title={preview?.name || 'Preview'}>
        {preview && (
          <img
            src={preview.url}
            alt={preview.name}
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius)' }}
          />
        )}
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.csv,.xls,.xlsx"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <ImportTransactionsModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onSuccess={() => {
          load();
          setImportModal(false);
        }}
      />
    </div>
  );
}