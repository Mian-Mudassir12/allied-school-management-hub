import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useListAttendance,
  useMarkAttendance,
  useUpdateAttendance,
  getListAttendanceQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { AttendanceReport } from "@/components/attendance-report";
import { isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Holiday = {
  id: number;
  date: string;
  scope: "school" | "class";
  class: string | null;
  reason: string;
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [holidayScope, setHolidayScope] = useState<"school" | "class">("school");
  const [holidayReason, setHolidayReason] = useState("Holiday");

  // Load distinct classes from DB so new classes auto-appear
  const { data: classesList = [] } = useQuery<string[]>({
    queryKey: ["students-classes"],
    queryFn: async () => {
      const res = await fetch("/api/students/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json() as Promise<string[]>;
    },
  });

  // Once classesList loads, default to first class
  useEffect(() => {
    if (classesList.length > 0 && !selectedClass) {
      setSelectedClass(classesList[0]);
    }
  }, [classesList, selectedClass]);

  const { data: attendanceRecords, isLoading } = useListAttendance(
    { class: selectedClass, date },
    {
      query: {
        queryKey: getListAttendanceQueryKey({ class: selectedClass, date }),
        enabled: !!selectedClass,
      }
    }
  );

  const markAttendance = useMarkAttendance();
  const updateAttendance = useUpdateAttendance();

  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ["academic-holidays", date, selectedClass],
    queryFn: async () => {
      const res = await fetch(`/api/academic/holidays?date=${encodeURIComponent(date)}&class=${encodeURIComponent(selectedClass)}`);
      if (!res.ok) throw new Error("Failed to fetch holidays");
      return res.json() as Promise<Holiday[]>;
    },
    enabled: !!date,
  });

  const activeHoliday = holidays.find((holiday) => holiday.scope === "school" || holiday.class === selectedClass);

  const addHoliday = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/academic/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          scope: holidayScope,
          class: holidayScope === "class" ? selectedClass : null,
          reason: holidayReason,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save holiday");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-holidays", date, selectedClass] });
      queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey({ class: selectedClass, date }) });
      toast({ title: "Holiday saved", description: holidayScope === "school" ? "Whole school marked off." : `${selectedClass} marked off.` });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleToggleAttendance = (studentId: number, recordId: number | null | undefined, currentPresent: boolean) => {
    if (recordId) {
      updateAttendance.mutate(
        { id: recordId, data: { present: !currentPresent } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey({ class: selectedClass, date }) });
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          }
        }
      );
    } else {
      markAttendance.mutate(
        { data: { studentId, date, present: !currentPresent } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey({ class: selectedClass, date }) });
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          }
        }
      );
    }
  };

  const presentCount = attendanceRecords?.filter(r => r.present).length ?? 0;
  const absentCount = attendanceRecords?.filter(r => !r.present).length ?? 0;
  const totalCount = attendanceRecords?.length ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Daily Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark and monitor student attendance.</p>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-1.5 w-full md:w-64">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {classesList.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full md:w-48">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {totalCount > 0 && (
              <div className="flex gap-4 text-sm font-medium">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md">
                  Present: {presentCount}
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-md">
                  Absent: {absentCount}
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md">
                  Total: {totalCount}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isAdmin() && (
            <div className="p-4 border-b bg-amber-50/60">
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_220px_auto] gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Holiday Scope</Label>
                  <Select value={holidayScope} onValueChange={(value) => setHolidayScope(value as "school" | "class")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">Whole School</SelectItem>
                      <SelectItem value="class">Selected Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reason</Label>
                  <Input value={holidayReason} onChange={(event) => setHolidayReason(event.target.value)} placeholder="Holiday reason" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {holidayScope === "school" ? "This date will be off for all classes." : selectedClass ? `${selectedClass} will be off on this date.` : "Select a class first."}
                </div>
                <Button onClick={() => addHoliday.mutate()} disabled={addHoliday.isPending || (holidayScope === "class" && !selectedClass)}>
                  {addHoliday.isPending ? "Saving..." : "Set Holiday"}
                </Button>
              </div>
            </div>
          )}

          {activeHoliday && (
            <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Holiday: {activeHoliday.reason} ({activeHoliday.scope === "school" ? "Whole School" : activeHoliday.class})
            </div>
          )}

          {!selectedClass ? (
            <div className="p-12 text-center text-muted-foreground">
              {classesList.length === 0
                ? "No students registered yet. Add students first."
                : "Select a class to view attendance."}
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading attendance...</div>
          ) : attendanceRecords && attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Roll No</th>
                    <th className="px-6 py-3 font-medium">Student Name</th>
                    <th className="px-6 py-3 font-medium text-right">Status / Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceRecords.map((record) => (
                    <tr key={record.studentId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">{record.rollNumber}</td>
                      <td className="px-6 py-4 font-medium">{record.studentName}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <AttendanceReport
                            studentId={record.studentId}
                            studentName={record.studentName ?? ""}
                            studentClass={record.class ?? ""}
                            section={null}
                            rollNumber={record.rollNumber ?? ""}
                          />
                          {isAdmin() ? (
                            <>
                              <Button
                                size="sm"
                                variant={record.present ? "default" : "outline"}
                                className={record.present ? "bg-green-600 hover:bg-green-700 text-white" : "text-muted-foreground"}
                                onClick={() => {
                                  if (!record.present) handleToggleAttendance(record.studentId, record.id ?? null, record.present);
                                }}
                                disabled={!!activeHoliday || updateAttendance.isPending || markAttendance.isPending}
                              >
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={!record.present ? "default" : "outline"}
                                className={!record.present ? "bg-red-600 hover:bg-red-700 text-white" : "text-muted-foreground"}
                                onClick={() => {
                                  if (record.present) handleToggleAttendance(record.studentId, record.id ?? null, record.present);
                                }}
                                disabled={!!activeHoliday || updateAttendance.isPending || markAttendance.isPending}
                              >
                                Absent
                              </Button>
                            </>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {record.present ? 'Present' : 'Absent'}
                            </span>
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
              <p className="text-muted-foreground">No students found in this class.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
