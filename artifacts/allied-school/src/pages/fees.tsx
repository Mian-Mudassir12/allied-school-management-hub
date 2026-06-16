import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useListFees,
  useUpdateFeeRecord,
  useGenerateMonthlyFees,
  getListFeesQueryKey,
  getGetDashboardStatsQueryKey,
  getGetClassSummaryQueryKey,
  getGetDailyCollectionQueryKey
} from "@workspace/api-client-react";
import { FeeChallan } from "@/components/fee-challan";
import { isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

type PendingFeeRecord = {
  id: number;
  studentId: number;
  month: number;
  year: number;
  amount: number;
  paid: boolean;
  paidDate: string | null;
  studentName: string;
  rollNumber: string;
  class: string;
  section: string | null;
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"monthly" | "pending">("monthly");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Load live classes from DB
  const { data: classesList = [] } = useQuery<string[]>({
    queryKey: ["students-classes"],
    queryFn: async () => {
      const res = await fetch("/api/students/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json() as Promise<string[]>;
    },
  });

  useEffect(() => {
    if (classesList.length > 0 && !selectedClass) {
      setSelectedClass(classesList[0]);
    }
  }, [classesList, selectedClass]);

  // Monthly fees
  const { data: fees, isLoading: feesLoading } = useListFees(
    { class: selectedClass, month, year },
    {
      query: {
        queryKey: getListFeesQueryKey({ class: selectedClass, month, year }),
        enabled: !!selectedClass && activeTab === "monthly",
      }
    }
  );

  // All pending fees
  const { data: pendingFees, isLoading: pendingLoading, refetch: refetchPending } = useQuery<PendingFeeRecord[]>({
    queryKey: ["fees-pending"],
    queryFn: async () => {
      const res = await fetch("/api/fees/pending");
      if (!res.ok) throw new Error("Failed to fetch pending fees");
      return res.json() as Promise<PendingFeeRecord[]>;
    },
    enabled: activeTab === "pending",
  });

  const updateFee = useUpdateFeeRecord();
  const generateFees = useGenerateMonthlyFees();

  const handleTogglePaid = (id: number, currentStatus: boolean, source: "monthly" | "pending") => {
    updateFee.mutate(
      {
        id,
        data: {
          paid: !currentStatus,
          paidDate: !currentStatus ? new Date().toISOString() : undefined
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeesQueryKey({ class: selectedClass, month, year }) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetClassSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDailyCollectionQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["fees-pending"] });
          toast({ title: "Fee updated", description: `Marked as ${!currentStatus ? "Paid" : "Unpaid"}` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update fee record", variant: "destructive" });
        }
      }
    );
  };

  const handleGenerateFees = () => {
    generateFees.mutate(
      { data: { month, year } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListFeesQueryKey({ class: selectedClass, month, year }) });
          queryClient.invalidateQueries({ queryKey: ["fees-pending"] });
          toast({ title: "Fees Generated", description: (data as { message?: string })?.message ?? `Fee records generated for ${month}/${year}` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to generate fee records", variant: "destructive" });
        }
      }
    );
  };

  const handlePrintClassChallans = () => {
    const printable = (fees ?? []).filter((record) => !record.paid);
    if (printable.length === 0) {
      toast({ title: "No challans to print", description: "This class has no unpaid fee records for the selected month." });
      return;
    }
    const win = window.open("", "", "width=1000,height=800");
    if (!win) return;
    const challans = printable.map((record) => `
      <section class="challan">
        <div class="copy">Parent Copy</div>
        <header>
          <div>
            <h1>Allied School Rehman Campus</h1>
            <p>Fee Collection Challan - ${MONTH_NAMES[record.month]} ${record.year}</p>
          </div>
          <strong>Rs. ${record.amount.toLocaleString()}</strong>
        </header>
        <div class="grid">
          <span>Student Name</span><b>${record.studentName ?? ""}</b>
          <span>Roll Number</span><b>${record.rollNumber ?? ""}</b>
          <span>Class</span><b>${record.class ?? ""}</b>
          <span>Month</span><b>${MONTH_NAMES[record.month]} ${record.year}</b>
        </div>
        <table>
          <tr><th>Description</th><th>Amount (Rs.)</th></tr>
          <tr><td>Monthly Fee</td><td>${record.amount.toLocaleString()}</td></tr>
          <tr class="total"><td>Total Due</td><td>${record.amount.toLocaleString()}</td></tr>
          <tr><td colspan="2"><b>Online Payment Methods</b><br>JAZZCASH Account Number: [To be provided later]<br>EASYPAISA Account Number: [To be provided later]</td></tr>
        </table>
        <div class="signatures"><span>Cashier Signature</span><span>Parent Signature</span></div>
      </section>
    `).join("");
    win.document.write(`<!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>${selectedClass} Challans</title>
      <style>
        * { box-sizing: border-box; }
        @page { size: A4 portrait; margin: 7mm; }
        body { margin: 0; font-family: Arial, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
        .challan { border: 1.5px solid #1e3a5f; padding: 5mm; min-height: 128mm; break-inside: avoid; page-break-inside: avoid; }
        .copy { text-align: right; color: #666; font-size: 9px; margin-bottom: 3mm; }
        header { display: flex; align-items: start; justify-content: space-between; gap: 8px; border-bottom: 2px double #8C1C13; padding-bottom: 4mm; margin-bottom: 4mm; }
        h1 { margin: 0; color: #1e3a5f; font-size: 15px; }
        p { margin: 1mm 0 0; font-size: 10px; color: #555; }
        header strong { color: #8C1C13; font-size: 14px; white-space: nowrap; }
        .grid { display: grid; grid-template-columns: 82px 1fr; gap: 2mm; font-size: 10px; margin-bottom: 4mm; }
        .grid span { color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #1e3a5f; color: #fff; text-align: left; padding: 4px 6px; }
        td { border-bottom: 1px solid #ddd; padding: 4px 6px; }
        th:last-child, td:last-child { text-align: right; }
        td[colspan="2"] { text-align: left; color: #1e3a5f; background: #eef6ff; }
        .total td { background: #f0f4f8; color: #8C1C13; font-weight: 700; }
        .signatures { display: flex; justify-content: space-between; margin-top: 10mm; font-size: 9px; color: #555; }
        .signatures span { border-top: 1px solid #333; min-width: 34mm; padding-top: 2mm; text-align: center; }
      </style></head><body><main class="sheet">${challans}</main></body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  // Group pending by class for summary
  const pendingByClass = (pendingFees ?? []).reduce<Record<string, { count: number; total: number }>>((acc, r) => {
    const key = r.section ? `${r.class} (${r.section})` : r.class;
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count++;
    acc[key].total += r.amount;
    return acc;
  }, {});

  const totalPendingAmount = (pendingFees ?? []).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Fee Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track student fee collections.</p>
        </div>
        {activeTab === "monthly" && isAdmin() && (
          <Button onClick={handleGenerateFees} disabled={generateFees.isPending} variant="secondary">
            {generateFees.isPending ? "Generating..." : `Generate Fees for ${month}/${year}`}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "monthly"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly View
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Fees
          {pendingFees && pendingFees.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendingFees.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Monthly View ── */}
      {activeTab === "monthly" && (
        <Card>
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="space-y-1.5 w-full md:w-64">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesList.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full md:w-36">
                <Label>Month</Label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>
                        {format(new Date(2000, m - 1, 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full md:w-32">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2 w-full md:w-auto"
                onClick={handlePrintClassChallans}
                disabled={!fees || fees.filter((record) => !record.paid).length === 0}
              >
                <Printer className="w-4 h-4" /> Print Class Challans
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedClass ? (
              <div className="p-12 text-center text-muted-foreground">Select a class to view fees.</div>
            ) : feesLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading fee records...</div>
            ) : fees && fees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium">Roll No</th>
                      <th className="px-6 py-3 font-medium">Student Name</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fees.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">{record.rollNumber}</td>
                        <td className="px-6 py-4 font-medium">{record.studentName}</td>
                        <td className="px-6 py-4 font-mono">Rs. {record.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          {record.paid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Paid {record.paidDate && `on ${format(new Date(record.paidDate), "dd MMM")}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!record.paid && (
                              <FeeChallan
                                studentId={record.studentId}
                                studentName={record.studentName ?? ""}
                                rollNumber={record.rollNumber ?? ""}
                                studentClass={record.class ?? ""}
                                section={null}
                                month={record.month}
                                year={record.year}
                                amount={record.amount}
                              />
                            )}
                            {isAdmin() && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-muted-foreground">{record.paid ? "Mark Unpaid" : "Mark Paid"}</span>
                                <Checkbox
                                  checked={record.paid}
                                  onCheckedChange={() => handleTogglePaid(record.id, record.paid, "monthly")}
                                  disabled={updateFee.isPending}
                                  className={record.paid ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" : ""}
                                />
                              </label>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <p className="text-muted-foreground mb-4">No fee records found for this class and month.</p>
                <Button onClick={handleGenerateFees} disabled={generateFees.isPending}>
                  Generate Fees Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Pending Fees ── */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* Summary cards */}
          {pendingFees && pendingFees.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Total Pending</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{pendingFees.length}</p>
                  <p className="text-xs text-red-500 mt-0.5">students</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Total Amount</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    Rs. {totalPendingAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-500 mt-0.5">outstanding</p>
                </CardContent>
              </Card>
              {Object.entries(pendingByClass).slice(0, 2).map(([cls, info]) => (
                <Card key={cls} className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide truncate">{cls}</p>
                    <p className="text-2xl font-bold text-yellow-800 mt-1">{info.count}</p>
                    <p className="text-xs text-yellow-600 mt-0.5">Rs. {info.total.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="pb-3 border-b bg-red-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">All Pending Fees</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pendingFees
                      ? `${pendingFees.length} unpaid record${pendingFees.length !== 1 ? "s" : ""} across all classes`
                      : "Loading..."}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetchPending()} disabled={pendingLoading}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading pending fees...</div>
              ) : !pendingFees || pendingFees.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">✓</div>
                  <p className="font-semibold text-foreground">All fees are clear!</p>
                  <p className="text-sm text-muted-foreground">No pending fees found across any class.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 font-medium">Roll No</th>
                        <th className="px-6 py-3 font-medium">Student Name</th>
                        <th className="px-6 py-3 font-medium">Class</th>
                        <th className="px-6 py-3 font-medium">Month / Year</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingFees.map((record) => (
                        <tr key={record.id} className="hover:bg-red-50/40 transition-colors">
                          <td className="px-6 py-4 text-muted-foreground">{record.rollNumber}</td>
                          <td className="px-6 py-4 font-medium">{record.studentName}</td>
                          <td className="px-6 py-4">
                            <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                              {record.section ? `${record.class} (${record.section})` : record.class}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {MONTH_NAMES[record.month]} {record.year}
                          </td>
                          <td className="px-6 py-4 font-mono text-red-700 font-semibold">
                            Rs. {record.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                            <FeeChallan
                              studentId={record.studentId}
                              studentName={record.studentName ?? ""}
                              rollNumber={record.rollNumber ?? ""}
                              studentClass={record.class ?? ""}
                              section={record.section}
                              month={record.month}
                              year={record.year}
                              amount={record.amount}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                              onClick={() => handleTogglePaid(record.id, false, "pending")}
                              disabled={updateFee.isPending}
                            >
                              Mark Paid
                            </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
