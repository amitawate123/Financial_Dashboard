const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const FIELDS = ['Date', 'Category', 'Type', 'Amount', 'Notes', 'Created By'];

const formatRow = (tx) => ({
  Date: new Date(tx.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  Category: tx.category.charAt(0).toUpperCase() + tx.category.slice(1),
  Type: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
  Amount: tx.amount,
  Notes: tx.notes || '',
  'Created By': tx.createdBy?.name || '—',
});

const buildFilename = (query, ext) => {
  const year = new Date().getFullYear();
  const typeLabel = query.type === 'expense' ? 'Expenses' : query.type === 'income' ? 'Income' : 'Transactions';

  if (query.startDate) {
    const d = new Date(query.startDate);
    const month = d.toLocaleString('en', { month: 'long' });
    const y = d.getFullYear();
    if (query.type === 'expense' || query.type === 'income') {
      return `${month} ${typeLabel}.${ext}`;
    }
    return `${month} ${y} ${typeLabel}.${ext}`;
  }

  return `${year} ${typeLabel}.${ext}`;
};

const toCsv = (transactions, query) => {
  const rows = transactions.map(formatRow);
  const csv = rows.length
    ? new Parser({ fields: FIELDS }).parse(rows)
    : FIELDS.join(',');
  return {
    buffer: Buffer.from(csv, 'utf-8'),
    filename: buildFilename(query, 'csv'),
    contentType: 'text/csv; charset=utf-8',
  };
};

const toExcel = async (transactions, query) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Finance Dashboard';
  const sheet = workbook.addWorksheet('Transactions');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Notes', key: 'notes', width: 28 },
    { header: 'Created By', key: 'createdBy', width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFF4FF' },
  };

  transactions.forEach((tx) => {
    sheet.addRow({
      date: formatRow(tx).Date,
      category: formatRow(tx).Category,
      type: formatRow(tx).Type,
      amount: tx.amount,
      notes: tx.notes || '',
      createdBy: tx.createdBy?.name || '—',
    });
  });

  sheet.getColumn('amount').numFmt = '#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(buffer),
    filename: buildFilename(query, 'xlsx'),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

const toPdf = (transactions, query) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        filename: buildFilename(query, 'pdf'),
        contentType: 'application/pdf',
      });
    });
    doc.on('error', reject);

    const title = buildFilename(query, 'pdf').replace('.pdf', '');
    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text(`Generated ${new Date().toLocaleString('en-IN')} · ${transactions.length} record(s)`);
    doc.moveDown(1);
    doc.fillColor('#000000');

    if (transactions.length === 0) {
      doc.fontSize(11).text('No transactions match the current filters.');
      doc.end();
      return;
    }

    const colX = [40, 100, 175, 230, 290, 400];
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Notes'];
    let y = doc.y;

    const drawHeader = () => {
      doc.font('Helvetica-Bold').fontSize(9);
      headers.forEach((h, i) => doc.text(h, colX[i], y, { width: colX[i + 1] - colX[i] - 4, lineBreak: false }));
      y += 16;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#cccccc').stroke();
      y += 6;
      doc.font('Helvetica').fontSize(9);
    };

    drawHeader();

    transactions.forEach((tx) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
        drawHeader();
      }
      const row = formatRow(tx);
      const cells = [row.Date, row.Category, row.Type, String(row.Amount), row.Notes];
      cells.forEach((cell, i) => {
        doc.text(String(cell).slice(0, 40), colX[i], y, {
          width: colX[i + 1] - colX[i] - 4,
          lineBreak: false,
        });
      });
      y += 14;
    });

    doc.end();
  });

const generateExport = async (transactions, format, query) => {
  switch (format) {
    case 'csv':
      return toCsv(transactions, query);
    case 'excel':
      return toExcel(transactions, query);
    case 'pdf':
      return toPdf(transactions, query);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

module.exports = { generateExport, buildFilename };
