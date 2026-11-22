'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');

test('invoice uses HSN GST and matches the billed tax breakdown', function () {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 1 }];
  const ledgerTotals = pricing.computeTotals(items, '');
  const invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.equal(ledgerTotals.tax, 5);
  assert.equal(ledgerTotals.total, 105);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.rows[0].lineTax, 5);
  assert.equal(invoiceFigures.tax, ledgerTotals.tax);
  assert.equal(invoiceFigures.cgst, ledgerTotals.cgst);
  assert.equal(invoiceFigures.sgst, ledgerTotals.sgst);
  assert.equal(invoiceFigures.total, ledgerTotals.total);
});

test('invoice uses the billed capped coupon discount before GST', function () {
  const items = [{ id: 5, name: 'Groundnut Oil', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }];
  const ledgerTotals = pricing.computeTotals(items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(ledgerTotals.discount, 150);
  assert.equal(ledgerTotals.tax, 104.5);
  assert.equal(ledgerTotals.total, 2194.5);
  assert.equal(invoiceFigures.discount, ledgerTotals.discount);
  assert.equal(invoiceFigures.tax, ledgerTotals.tax);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.rows[0].lineTax, 104.5);
  assert.equal(invoiceFigures.cgst, ledgerTotals.cgst);
  assert.equal(invoiceFigures.sgst, ledgerTotals.sgst);
  assert.equal(invoiceFigures.total, ledgerTotals.total);
});

test('invoice line GST breakdown matches orders with different HSN rates', function () {
  const items = [
    { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 },
    { id: 2, name: 'Ghee', sku: 'GHEE-1', hsn: '0405', price: 1000, qty: 1 }
  ];
  const ledgerTotals = pricing.computeTotals(items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    invoiceFigures.rows.map(function (row) { return { gstPercent: row.gstPercent, lineTax: row.lineTax }; }),
    [{ gstPercent: 5, lineTax: 46.25 }, { gstPercent: 12, lineTax: 111 }]
  );
  assert.equal(invoiceFigures.tax, 157.25);
  assert.equal(invoiceFigures.cgst, 78.63);
  assert.equal(invoiceFigures.sgst, 78.62);
  assert.equal(invoiceFigures.total, ledgerTotals.total);
});

test('GST reconciliation matches billed totals and excludes cancelled orders', function () {
  const order = {
    id: 1001,
    date: '22/11/2026',
    customer: 'Walk-in',
    status: 'completed',
    coupon: '',
    items: [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 1 }],
    subtotal: 100,
    discount: 0,
    tax: 5,
    total: 105
  };
  const cancelledOrder = Object.assign({}, order, { id: 1002, status: 'cancelled' });

  const result = reports.getGstReconciliation({ orders: [order, cancelledOrder] });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].invoiceTax, order.tax);
  assert.equal(result.rows[0].invoiceTotal, order.total);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].matched, true);
});
