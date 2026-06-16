import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logoUrl from "@assets/image_1781358894878.png";

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

type FeeRow = { id: number; month: number; year: number; amount: number; paid: boolean };
type StudentDetail = { name: string; fatherName: string; class: string; section: string | null; rollNumber: string; phone: string; address: string | null; monthlyFee: number };

interface FeeChallanProps {
  studentId: number;
  studentName: string;
  rollNumber: string;
  studentClass: string;
  section: string | null;
  month: number;
  year: number;
  amount: number;
}

export function FeeChallan({ studentId, studentName, rollNumber, studentClass, section, month, year, amount }: FeeChallanProps) {
  const [open, setOpen] = useState(false);
  const [lastDate, setLastDate] = useState(() => {
    const d = new Date(year, month, 10); // 10th of next month
    return format(d, "yyyy-MM-dd");
  });
  const printRef = useRef<HTMLDivElement>(null);

  const { data: student } = useQuery<StudentDetail>({
    queryKey: ["student-detail", studentId],
    queryFn: async () => {
      const r = await fetch(`/api/students/${studentId}`);
      return r.json();
    },
    enabled: open,
  });

  const { data: pendingFees = [] } = useQuery<FeeRow[]>({
    queryKey: ["student-pending-fees", studentId],
    queryFn: async () => {
      const r = await fetch(`/api/fees?studentId=${studentId}`);
      const all: FeeRow[] = await r.json();
      return all.filter(f => !f.paid);
    },
    enabled: open,
  });

  const otherDues = pendingFees.filter(f => !(f.month === month && f.year === year));
  const otherDuesTotal = otherDues.reduce((s, f) => s + f.amount, 0);
  const arrearsNotice = otherDues.length > 0
    ? `Last Month Pending Arrears: Rs. ${otherDuesTotal.toLocaleString()} - Last ${otherDues.length} Months fees pending`
    : "";
  const grandTotal = amount + otherDuesTotal;
  const classDisplay = section ? `${studentClass} (${section})` : studentClass;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const absLogo = window.location.origin + logoUrl;
    const win = window.open("", "", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Fee Challan - ${studentName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 6mm; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #111; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 196mm; margin: 0 auto; padding: 7mm; border: 1.5px solid #1e3a5f; page-break-inside: avoid; }
  .header { display: flex; align-items: center; gap: 10px; border-bottom: 2px double #8C1C13; padding-bottom: 6px; margin-bottom: 6px; }
  .header img { width: 38px; height: 38px; object-fit: contain; }
  .header-text h1 { font-size: 16px; font-weight: bold; color: #1e3a5f; letter-spacing: 0.2px; }
  .header-text p { font-size: 9px; color: #555; margin-top: 1px; }
  .title-bar { background: #1e3a5f; color: white; text-align: center; padding: 4px; font-size: 11px; font-weight: bold; letter-spacing: 0.4px; margin-bottom: 7px; }
  .copy-label { text-align: right; font-size: 9px; color: #888; margin-bottom: 3px; font-style: italic; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin-bottom: 7px; }
  .info-row { display: flex; gap: 8px; }
  .info-label { color: #555; min-width: 90px; font-size: 9px; }
  .info-value { font-weight: bold; color: #111; font-size: 9px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 7px; }
  th { background: #1e3a5f; color: white; padding: 4px 7px; text-align: left; font-size: 9px; }
  td { padding: 4px 7px; border-bottom: 1px solid #ddd; font-size: 9px; }
  .total-row td { background: #f0f4f8; font-weight: bold; font-size: 10px; color: #1e3a5f; }
  .due-highlight { font-size: 11px; color: #8C1C13; font-weight: bold; }
  .last-date { background: #fff3cd; border: 1px solid #ffc107; padding: 5px 8px; border-radius: 3px; margin-bottom: 7px; font-size: 10px; }
  .last-date strong { color: #8C1C13; }
  .arrears { background: #fdecec; border: 1px solid #e5a3a3; color: #8C1C13; padding: 5px 8px; border-radius: 3px; margin-bottom: 6px; font-weight: bold; }
  .online { background: #eef6ff; border: 1px solid #b8d8f3; padding: 6px 8px; border-radius: 3px; margin-bottom: 7px; font-size: 9px; color: #1e3a5f; }
  .online strong { display: block; margin-bottom: 4px; }
  .signature-row { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 4px; border-top: 1px solid #ccc; }
  .sig-box { text-align: center; font-size: 9px; color: #555; }
  .sig-line { width: 95px; border-top: 1px solid #333; margin: 14px auto 3px; }
  .divider { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
</style>
</head><body>
<div class="page">
  <div class="copy-label">School Copy</div>
  <div class="header">
    <img src="${absLogo}" alt="Allied School Logo" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>Allied School Rehman Campus</h1>
      <p>4GD, Renala Khurd, Punjab • Tel: ${student?.phone ?? ""}</p>
    </div>
  </div>
  <div class="title-bar">FEE COLLECTION CHALLAN — ${MONTHS[month]} ${year}</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Student Name:</span><span class="info-value">${studentName}</span></div>
    <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value">${rollNumber}</span></div>
    <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${classDisplay}</span></div>
    <div class="info-row"><span class="info-label">Father's Name:</span><span class="info-value">${student?.fatherName ?? "—"}</span></div>
    <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${student?.address ?? "—"}</span></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount (Rs.)</th></tr></thead>
    <tbody>
      <tr><td>Monthly Fee — ${MONTHS[month]} ${year}</td><td style="text-align:right">${amount.toLocaleString()}</td></tr>
      ${otherDues.map(f => `<tr><td style="color:#8C1C13">Outstanding — ${MONTHS[f.month]} ${f.year}</td><td style="text-align:right;color:#8C1C13">${f.amount.toLocaleString()}</td></tr>`).join("")}
      <tr class="total-row"><td class="due-highlight">TOTAL DUE</td><td class="due-highlight" style="text-align:right">${grandTotal.toLocaleString()}</td></tr>
      ${arrearsNotice ? `<tr><td colspan="2" style="background:#fdecec;color:#8C1C13;font-weight:bold">${arrearsNotice}</td></tr>` : ""}
      <tr><td colspan="2" style="background:#eef6ff;color:#1e3a5f"><strong>Online Payment Methods</strong><br>Parents can transfer dues through mobile banking apps and show the transaction receipt at school office.<br>JAZZCASH Account Number: [To be provided later]<br>EASYPAISA Account Number: [To be provided later]</td></tr>
    </tbody>
  </table>
  <div class="last-date">⚠️ Last Date to Pay: <strong>${format(new Date(lastDate), "dd MMMM yyyy")}</strong> — Late payment may incur fine.</div>
  <div class="signature-row">
    <div class="sig-box"><div class="sig-line"></div>Cashier Signature</div>
    <div class="sig-box"><div class="sig-line"></div>Parent Signature</div>
    <div class="sig-box"><div class="sig-line"></div>Principal</div>
  </div>

  <hr class="divider">
  <div class="copy-label">Student / Parent Copy</div>
  <div class="header">
    <img src="${absLogo}" alt="Allied School Logo" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>Allied School Rehman Campus</h1>
      <p>4GD, Renala Khurd, Punjab</p>
    </div>
  </div>
  <div class="title-bar">FEE COLLECTION CHALLAN — ${MONTHS[month]} ${year}</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Student Name:</span><span class="info-value">${studentName}</span></div>
    <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value">${rollNumber}</span></div>
    <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${classDisplay}</span></div>
    <div class="info-row"><span class="info-label">Father's Name:</span><span class="info-value">${student?.fatherName ?? "—"}</span></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount (Rs.)</th></tr></thead>
    <tbody>
      <tr><td>Monthly Fee — ${MONTHS[month]} ${year}</td><td style="text-align:right">${amount.toLocaleString()}</td></tr>
      ${otherDues.map(f => `<tr><td style="color:#8C1C13">Outstanding — ${MONTHS[f.month]} ${f.year}</td><td style="text-align:right;color:#8C1C13">${f.amount.toLocaleString()}</td></tr>`).join("")}
      <tr class="total-row"><td class="due-highlight">TOTAL DUE</td><td class="due-highlight" style="text-align:right">${grandTotal.toLocaleString()}</td></tr>
      ${arrearsNotice ? `<tr><td colspan="2" style="background:#fdecec;color:#8C1C13;font-weight:bold">${arrearsNotice}</td></tr>` : ""}
      <tr><td colspan="2" style="background:#eef6ff;color:#1e3a5f"><strong>Online Payment Methods</strong><br>Parents can transfer dues through mobile banking apps and show the transaction receipt at school office.<br>JAZZCASH Account Number: [To be provided later]<br>EASYPAISA Account Number: [To be provided later]</td></tr>
    </tbody>
  </table>
  <div class="last-date">⚠️ Last Date to Pay: <strong>${format(new Date(lastDate), "dd MMMM yyyy")}</strong></div>
  <div class="signature-row">
    <div class="sig-box"><div class="sig-line"></div>Cashier Signature</div>
    <div class="sig-box"><div class="sig-line"></div>Parent Signature</div>
  </div>
</div>
</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
          <Printer className="w-3.5 h-3.5" /> Challan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" /> Fee Challan — {studentName}
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div ref={printRef} className="border rounded-lg overflow-hidden bg-white">
          {/* School Header */}
          <div className="flex items-center gap-3 p-4 border-b-2 border-double border-[#8C1C13]">
            <img src={logoUrl} alt="logo" className="w-14 h-14 object-contain" />
            <div>
              <h2 className="text-lg font-bold text-[#1e3a5f]">Allied School Rehman Campus</h2>
              <p className="text-xs text-muted-foreground">4GD, Renala Khurd, Punjab</p>
            </div>
          </div>
          <div className="bg-[#1e3a5f] text-white text-center py-2 font-bold tracking-wider text-sm">
            FEE COLLECTION CHALLAN — {MONTHS[month].toUpperCase()} {year}
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
            <div className="flex gap-2"><span className="text-muted-foreground w-28">Student:</span><span className="font-semibold">{studentName}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-28">Roll No:</span><span className="font-semibold">{rollNumber}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-28">Class:</span><span className="font-semibold">{classDisplay}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-28">Father:</span><span className="font-semibold">{student?.fatherName ?? "—"}</span></div>
          </div>

          {/* Fee Table */}
          <table className="w-full text-sm border-t">
            <thead className="bg-[#1e3a5f] text-white">
              <tr>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-right px-4 py-2">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2">Monthly Fee — {MONTHS[month]} {year}</td>
                <td className="px-4 py-2 text-right font-mono">{amount.toLocaleString()}</td>
              </tr>
              {otherDues.map(f => (
                <tr key={f.id} className="border-b bg-red-50">
                  <td className="px-4 py-2 text-red-700">Outstanding — {MONTHS[f.month]} {f.year}</td>
                  <td className="px-4 py-2 text-right font-mono text-red-700">{f.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-blue-50">
                <td className="px-4 py-2 font-bold text-[#1e3a5f] text-base">TOTAL DUE</td>
                <td className="px-4 py-2 text-right font-bold font-mono text-[#8C1C13] text-base">{grandTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {arrearsNotice && (
            <div className="p-3 bg-red-50 border-t border-red-200 text-sm font-semibold text-[#8C1C13]">
              {arrearsNotice}
            </div>
          )}

          <div className="p-4 bg-blue-50 border-t border-blue-200 text-sm text-[#1e3a5f] space-y-1">
            <p className="font-semibold">Online Payment Methods</p>
            <p>Parents can transfer dues through mobile banking apps and show the transaction receipt at school office.</p>
            <p>JAZZCASH Account Number: [To be provided later]</p>
            <p>EASYPAISA Account Number: [To be provided later]</p>
          </div>

          {/* Last Date */}
          <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-sm">
            <span className="text-muted-foreground">Last Date to Pay: </span>
            <span className="font-bold text-[#8C1C13]">{format(new Date(lastDate), "dd MMMM yyyy")}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-end gap-4 pt-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm">Last Date to Pay</Label>
            <Input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)} />
          </div>
          <Button onClick={handlePrint} className="gap-2 bg-[#1e3a5f] hover:bg-[#152d4a]">
            <Printer className="w-4 h-4" /> Print Challan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
