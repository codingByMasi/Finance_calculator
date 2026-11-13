import { gst } from '../../calc/shopping';
import { money } from '../../format';
import { gstIndia } from '../../../config/gst-india';
import { num, str, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'mode', label: 'What do you want to do?', type: 'select', default: 'add',
      options: [{ value: 'add', label: 'Add GST to a price' }, { value: 'remove', label: 'Remove GST from a price' }] },
    { id: 'amount', label: 'Amount', type: 'number', default: 10000, min: 0, max: 1e13, step: 'any', prefix: 'cur' },
    { id: 'rate', label: 'GST rate', type: 'select', default: String(gstIndia.defaultRate),
      options: gstIndia.rates.map((r) => ({ value: String(r), label: `${r}%` })),
      hint: 'Standard slabs since 22 September 2025. Check the rate for your item (HSN/SAC code) on the official GST portal.' },
  ],
  compute(v) {
    const mode = str(v, 'mode') as 'add' | 'remove', rate = Number(str(v, 'rate')), a = num(v, 'amount');
    const r = gst(a, rate, mode);
    const m = (x: number) => money(x, 'INR', 2);
    const steps = mode === 'add'
      ? [
        `GST amount = price × rate ÷ 100 = ${m(a)} × ${rate} ÷ 100 = ${m(r.gst)}.`,
        `Total price = price + GST = ${m(a)} + ${m(r.gst)} = ${m(r.total)}.`,
        `For an intra-state sale the GST splits equally: CGST = SGST = ${m(r.gst)} ÷ 2 = ${m(r.cgst)}.`,
      ]
      : [
        `Pre-GST price = GST-inclusive price ÷ (1 + rate ÷ 100) = ${m(a)} ÷ ${(1 + rate / 100).toFixed(2)} = ${m(r.base)}.`,
        `GST amount = inclusive price − pre-GST price = ${m(a)} − ${m(r.base)} = ${m(r.gst)}.`,
        `For an intra-state sale: CGST = SGST = ${m(r.gst)} ÷ 2 = ${m(r.cgst)}.`,
      ];
    return {
      headline: mode === 'add' ? { label: 'Total including GST', value: m(r.total) } : { label: 'Price before GST', value: m(r.base) },
      rows: [
        { label: 'Price before GST', value: m(r.base) },
        { label: `GST (${rate}%)`, value: m(r.gst) },
        { label: 'CGST (half)', value: m(r.cgst) },
        { label: 'SGST/UTGST (half)', value: m(r.sgst) },
        { label: 'Price including GST', value: m(r.total), strong: true },
      ],
      steps,
      chart: r.total > 0 ? { kind: 'donut', title: 'Price vs GST', currency: 'INR', segments: [{ label: 'Pre-GST price', value: r.base }, { label: 'GST', value: r.gst }] } : undefined,
    };
  },
};
