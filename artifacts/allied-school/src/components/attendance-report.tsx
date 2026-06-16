import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, getDaysInMonth, getDay } from "date-fns";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logoUrl from "@assets/image_1781358894878.png";

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

type AttendanceRecord = { id: number; studentId: number; date: string; present: boolean };

interface AttendanceReportProps {
  studentId: number;
  studentName: string;
  studentClass: string;
  section: string | null;
  rollNumber: string;
  fatherName?: string;
}

export function AttendanceReport({ studentId, studentName, studentClass, section, rollNumber, fatherName }: AttendanceReportProps) {
  const [open, setOpen]   = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear]   = useState(new Date().getFullYear());

  const classDisplay = section ? `${studentClass} (${section})` : studentClass;

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["student-attendance-report", studentId, month, year],
    queryFn: async () => {
      const r = await fetch(`/api/students/${studentId}/attendance?month=${month}&year=${year}`);
      return r.json();
    },
    enabled: open,
  });

  const recordMap = new Map(records.map(r => [r.date, r]));

  // Build all days in the month
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = getDay(new Date(dateStr));
    const isSunday = dayOfWeek === 0;
    const rec = recordMap.get(dateStr);
    return { d, dateStr, dayName: DAYS[dayOfWeek], isSunday, rec };
  });

  const presentDays = records.filter(r => r.present).length;
  const absentDays  = records.filter(r => !r.present).length;
  const totalMarked = records.length;
  const percentage  = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0;

  const handlePrint = () => {
    const absLogo = window.location.origin + logoUrl;
    const rows = allDays.map(({ d, dateStr, dayName, isSunday, rec }) => {
      let status = "—";
      let color  = "#999";
      if (isSunday) { status = "Holiday"; color = "#888"; }
      else if (rec?.present === true)  { status = "✓ Present"; color = "#16a34a"; }
      else if (rec?.present === false) { status = "✗ Absent";  color = "#dc2626"; }
      return `<tr><td>${d}</td><td>${dateStr}</td><td>${dayName}</td><td style="color:${color};font-weight:${rec ? 'bold' : 'normal'}">${status}</td></tr>`;
    }).join("");

    const win = window.open("", "", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Attendance Report - ${studentName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; }
  .page { width: 720px; margin: 20px auto; padding: 24px; border: 2px solid #1e3a5f; }
  .header { display:flex; align-items:center; gap:16px; border-bottom:3px double #8C1C13; padding-bottom:14px; margin-bottom:14px; }
  .header img { width:64px; height:64px; object-fit:contain; }
  .header-text h1 { font-size:22px; font-weight:bold; color:#1e3a5f; }
  .header-text p { font-size:12px; color:#555; margin-top:2px; }
  .title-bar { background:#1e3a5f; color:white; text-align:center; padding:7px; font-size:15px; font-weight:bold; letter-spacing:1px; margin-bottom:16px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; margin-bottom:16px; }
  .info-row { display:flex; gap:8px; font-size:12px; }
  .info-label { color:#555; min-width:100px; }
  .info-value { font-weight:bold; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  th { background:#1e3a5f; color:white; padding:7px 10px; text-align:left; font-size:12px; }
  td { padding:6px 10px; border-bottom:1px solid #eee; font-size:12px; }
  tr:nth-child(even) td { background:#f9f9f9; }
  .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
  .sum-box { border:1px solid #ddd; border-radius:6px; padding:10px; text-align:center; }
  .sum-val { font-size:22px; font-weight:bold; }
  .sum-lbl { font-size:11px; color:#555; }
  .green { color:#16a34a; } .red { color:#dc2626; } .blue { color:#1e3a5f; }
  .signature-row { display:flex; justify-content:space-between; margin-top:32px; border-top:1px solid #ccc; padding-top:8px; }
  .sig-box { text-align:center; font-size:11px; color:#555; }
  .sig-line { width:140px; border-top:1px solid #333; margin:24px auto 4px; }
</style>
</head><body>
<div class="page">
  <div class="header">
    <img src="${absLogo}" alt="Allied School Logo" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>Allied School Rehman Campus</h1>
      <p>4GD, Renala Khurd, Punjab</p>
    </div>
  </div>
  <div class="title-bar">MONTHLY ATTENDANCE REPORT — ${MONTHS[month].toUpperCase()} ${year}</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Student Name:</span><span class="info-value">${studentName}</span></div>
    <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value">${rollNumber}</span></div>
    <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${classDisplay}</span></div>
    <div class="info-row"><span class="info-label">Father's Name:</span><span class="info-value">${fatherName ?? "—"}</span></div>
  </div>
  <div class="summary">
    <div class="sum-box"><div class="sum-val green">${presentDays}</div><div class="sum-lbl">Present Days</div></div>
    <div class="sum-box"><div class="sum-val red">${absentDays}</div><div class="sum-lbl">Absent Days</div></div>
    <div class="sum-box"><div class="sum-val blue">${totalMarked}</div><div class="sum-lbl">Days Marked</div></div>
    <div class="sum-box"><div class="sum-val blue">${percentage}%</div><div class="sum-lbl">Attendance %</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Date</th><th>Day</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="signature-row">
    <div class="sig-box"><div class="sig-line"></div>Class Teacher</div>
    <div class="sig-box"><div class="sig-line"></div>Parent / Guardian</div>
    <div class="sig-box"><div class="sig-line"></div>Principal</div>
  </div>
</div>
</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50">
          <FileText className="w-3.5 h-3.5" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Attendance Report — {studentName}
          </DialogTitle>
        </DialogHeader>

        {/* Month/Year picker */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Month</Label>
            <Select value={month.toString()} onValueChange={v => setMonth(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={m.toString()}>{MONTHS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28 space-y-1.5">
            <Label>Year</Label>
            <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())} />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{presentDays}</p>
            <p className="text-xs text-green-700">Present</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-2xl font-bold text-red-600">{absentDays}</p>
            <p className="text-xs text-red-700">Absent</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">{totalMarked}</p>
            <p className="text-xs text-blue-700">Marked</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <p className="text-2xl font-bold text-purple-600">{percentage}%</p>
            <p className="text-xs text-purple-700">Rate</p>
          </div>
        </div>

        {/* Date list */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-6">Loading...</p>
        ) : (
          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1e3a5f] text-white sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Day</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allDays.map(({ d, dateStr, dayName, isSunday, rec }) => (
                  <tr key={d} className={isSunday ? "bg-gray-50" : rec?.present ? "bg-green-50/50" : rec ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-2 font-medium">{dateStr}</td>
                    <td className="px-4 py-2 text-muted-foreground">{dayName}</td>
                    <td className="px-4 py-2">
                      {isSunday ? (
                        <span className="text-gray-400 text-xs">Holiday</span>
                      ) : rec?.present === true ? (
                        <span className="text-green-700 font-medium">✓ Present</span>
                      ) : rec?.present === false ? (
                        <span className="text-red-700 font-medium">✗ Absent</span>
                      ) : (
                        <span className="text-gray-300 text-xs">Not marked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Button onClick={handlePrint} className="gap-2 bg-[#1e3a5f] hover:bg-[#152d4a] w-full">
          <FileText className="w-4 h-4" /> Print Attendance Report
        </Button>
      </DialogContent>
    </Dialog>
  );
}
