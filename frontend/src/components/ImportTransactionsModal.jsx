import { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { transactionsAPI } from '../api/client';
import { Button, Modal, Alert } from './ui';

export default function ImportTransactionsModal({ open, onClose, onSuccess }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setFile(null);
    setError('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    setError('');
    try {
      await transactionsAPI.downloadImportTemplate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download template.');
    } finally {
      setDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Choose an Excel file (.xlsx) to import.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await transactionsAPI.importExcel(file);
      setResult(res.data.data);
      if (res.data.data?.imported > 0) {
        onSuccess?.();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.data?.errors?.length) {
        setResult(data.data);
      }
      setError(data?.message || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import from Excel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55 }}>
          Upload a spreadsheet with columns: <strong>Date</strong>, <strong>Category</strong>,{' '}
          <strong>Type</strong>, <strong>Amount</strong>, and optional <strong>Notes</strong>.
          Max 500 rows per file.
        </p>

        <Button variant="secondary" onClick={downloadTemplate} loading={downloading} style={{ width: '100%' }}>
          <Download size={15} /> Download template (.xlsx)
        </Button>

        <div
          style={{
            border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            textAlign: 'center',
            background: file ? 'var(--accent-bg)' : 'var(--bg)',
            cursor: 'pointer',
          }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setError('');
              setResult(null);
            }}
          />
          {file ? (
            <>
              <FileSpreadsheet size={28} color="var(--accent)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Click to change file</p>
            </>
          ) : (
            <>
              <Upload size={28} color="var(--text-3)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Click to select Excel file</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>.xlsx only</p>
            </>
          )}
        </div>

        <Alert type="error" message={error} />

        {result && (
          <div
            style={{
              padding: 14,
              borderRadius: 'var(--radius)',
              background: result.imported > 0 ? 'var(--green-bg)' : 'var(--red-bg)',
              border: `1px solid ${result.imported > 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: result.errors?.length ? 10 : 0 }}>
              {result.imported > 0 ? (
                <CheckCircle2 size={18} color="var(--green)" />
              ) : (
                <AlertCircle size={18} color="var(--red)" />
              )}
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Imported {result.imported} · Failed {result.failed}
              </span>
            </div>
            {result.errors?.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-2)', maxHeight: 120, overflow: 'auto' }}>
                {result.errors.map((e) => (
                  <li key={`${e.row}-${e.messages?.[0]}`}>
                    Row {e.row}: {e.messages?.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          <Button onClick={handleImport} loading={loading} disabled={!file}>
            <Upload size={15} /> Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
