const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');
const { AppError } = require('../middlewares/errorHandler');
const { CATEGORIES } = require('../constants/categories');

const MAX_ROWS = 500;

const HEADER_MAP = {
  date: 'date',
  category: 'category',
  type: 'type',
  amount: 'amount',
  notes: 'notes',
};

const normalizeHeader = (value) => {
  if (value == null) return '';
  return String(value).trim().toLowerCase().replace(/\s+/g, '');
};

const parseExcelDate = (value) => {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = value * 86400000;
    const d = new Date(excelEpoch.getTime() + ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeType = (value) => {
  const t = String(value || '').trim().toLowerCase();
  if (t === 'income' || t === 'expense') return t;
  if (t.startsWith('inc')) return 'income';
  if (t.startsWith('exp')) return 'expense';
  return null;
};

const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (CATEGORIES.includes(raw)) return raw;
  const match = CATEGORIES.find((c) => c.startsWith(raw) || raw.startsWith(c));
  return match || null;
};

const cellValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (value.result != null) return value.result;
    if (value.text != null) return value.text;
    if (value.richText) return value.richText.map((t) => t.text).join('');
  }
  return value;
};

const parseAmount = (value) => {
  const v = cellValue(value);
  if (v === '') return null;
  const n = Number(String(v).replace(/[,₹\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const mapColumns = (headerRow) => {
  const mapping = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(cell.value);
    if (HEADER_MAP[key]) mapping[HEADER_MAP[key]] = colNumber;
  });
  return mapping;
};

const validateRow = (row, rowNumber) => {
  const errors = [];
  const amount = parseAmount(row.amount);
  const type = normalizeType(row.type);
  const category = normalizeCategory(row.category);
  const date = parseExcelDate(row.date);
  const notes = row.notes != null ? String(row.notes).trim().slice(0, 500) : '';

  if (amount == null) errors.push('Invalid or missing amount');
  if (!type) errors.push('Type must be income or expense');
  if (!category) errors.push(`Invalid category (use: ${CATEGORIES.join(', ')})`);
  if (!date) errors.push('Invalid or missing date');

  if (errors.length) {
    return { error: { row: rowNumber, messages: errors } };
  }

  return {
    doc: {
      amount,
      type,
      category,
      date,
      notes: notes || undefined,
    },
  };
};

const parseWorkbook = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('Excel file has no worksheets.', 400);

  const headerRow = sheet.getRow(1);
  const colMap = mapColumns(headerRow);

  const required = ['amount', 'type', 'category', 'date'];
  const missing = required.filter((k) => !colMap[k]);
  if (missing.length) {
    throw new AppError(
      `Missing required columns: ${missing.join(', ')}. Use template headers: Date, Category, Type, Amount, Notes.`,
      400
    );
  }

  const rows = [];
  const errors = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const raw = {
      date: cellValue(row.getCell(colMap.date).value),
      category: cellValue(row.getCell(colMap.category).value),
      type: cellValue(row.getCell(colMap.type).value),
      amount: cellValue(row.getCell(colMap.amount).value),
      notes: colMap.notes ? cellValue(row.getCell(colMap.notes).value) : '',
    };

    const empty = [raw.date, raw.category, raw.type, raw.amount, raw.notes].every(
      (v) => v === '' || v == null
    );
    if (empty) return;

    const result = validateRow(raw, rowNumber);
    if (result.error) errors.push(result.error);
    else rows.push(result.doc);
  });

  if (rows.length === 0 && errors.length === 0) {
    throw new AppError('No data rows found in the spreadsheet.', 400);
  }
  if (rows.length > MAX_ROWS) {
    throw new AppError(`Maximum ${MAX_ROWS} transactions per import. Split your file and try again.`, 400);
  }

  return { rows, errors };
};

const importFromExcel = async (buffer, userId) => {
  const { rows, errors: parseErrors } = await parseWorkbook(buffer);

  const inserted = [];
  const insertErrors = [...parseErrors];

  for (let i = 0; i < rows.length; i++) {
    try {
      const tx = await Transaction.create({ ...rows[i], createdBy: userId });
      inserted.push(tx);
    } catch (err) {
      insertErrors.push({
        row: i + 2,
        messages: [err.message || 'Failed to save row'],
      });
    }
  }

  return {
    imported: inserted.length,
    failed: insertErrors.length,
    errors: insertErrors.slice(0, 50),
    transactions: inserted,
  };
};

const buildTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fintrack';
  const sheet = workbook.addWorksheet('Transactions');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Notes', key: 'notes', width: 28 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFF4FF' },
  };

  sheet.addRow({
    date: new Date(),
    category: 'food',
    type: 'expense',
    amount: 500,
    notes: 'Example row — delete or replace',
  });

  sheet.addRow({
    date: new Date(),
    category: 'salary',
    type: 'income',
    amount: 50000,
    notes: 'Monthly salary',
  });

  const instructions = workbook.addWorksheet('Instructions');
  instructions.getColumn(1).width = 70;
  instructions.addRow(['Column guide']);
  instructions.addRow(['Date — required (e.g. 2024-01-15 or Excel date)']);
  instructions.addRow(['Category — required: ' + CATEGORIES.join(', ')]);
  instructions.addRow(['Type — required: income or expense']);
  instructions.addRow(['Amount — required, positive number']);
  instructions.addRow(['Notes — optional, max 500 characters']);
  instructions.addRow(['']);
  instructions.addRow(['Max 500 rows per upload. First sheet "Transactions" is imported.']);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: 'fintrack-transactions-template.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

module.exports = { importFromExcel, buildTemplate, MAX_ROWS };
