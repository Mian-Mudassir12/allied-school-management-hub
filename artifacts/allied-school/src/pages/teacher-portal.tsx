import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, BookOpen, CalendarDays, ClipboardList, FileUp, LogOut, Printer, Search, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clearAuth, getAuthUsername } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Teacher = { id: number; name: string; assignedClass: string | null; subjectsTaught: string; teachingAssignments: string };
type AssignmentRow = { class: string; subject: string };
type ClassSubject = { id: number; class: string; subject: string; bookName: string };
type Student = { id: number; name: string; rollNumber: string; class: string };
type AttendanceRow = { id: number | null; studentId: number; studentName: string; rollNumber: string; class: string; present: boolean };
type TeacherAttendance = { id: number; date: string; present: boolean; status: string };
type TimetableRow = { id: number; teacherId: number; teacherName: string; class: string; subject: string; weekday: string; startTime: string; endTime: string };
type ExamPaper = { id: number; title: string; class: string; subject: string; examType: string; totalMarks: number; chapterFrom: string; chapterTo: string; lessonScope: string; fileUrl: string };
type ExamResult = { id: number; studentName: string; rollNumber: string; class: string; subject: string; totalMarks: number; obtainedMarks: number; percentage: number; grade: string; status: string; position: number | null; paperTitle: string | null; paperUrl: string | null; checkedPaperUrl?: string };

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type PortalView = "dashboard" | "schedule" | "attendance" | "register" | "exam" | "uploadResult" | "studentReport";
const viewPaths: Record<PortalView, string> = {
  dashboard: "/teacher-portal",
  schedule: "/teacher-portal/schedule",
  attendance: "/teacher-portal/attendance",
  register: "/teacher-portal/attendance-register",
  exam: "/teacher-portal/mark-exam",
  uploadResult: "/teacher-portal/upload-result",
  studentReport: "/teacher-portal/student-report",
};
const pathViews: Record<string, PortalView> = {
  schedule: "schedule",
  attendance: "attendance",
  "attendance-register": "register",
  "mark-exam": "exam",
  "upload-result": "uploadResult",
  "student-report": "studentReport",
};

function parseAssignments(value: string | null | undefined): AssignmentRow[] {
  if (!value) return [];
  try { return JSON.parse(value) as AssignmentRow[]; } catch {
    return value.split(";").map((item) => {
      const [klass, subject] = item.split(":");
      return { class: klass?.trim() ?? "", subject: subject?.trim() ?? "" };
    }).filter((row) => row.class && row.subject);
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TeacherPortalPage() {
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const username = getAuthUsername() ?? "";
  const today = format(new Date(), "yyyy-MM-dd");
  const todayName = format(new Date(), "EEEE");
  const [view, setView] = useState<PortalView>("dashboard");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});
  const [paperTitle, setPaperTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [chapterFrom, setChapterFrom] = useState("");
  const [chapterTo, setChapterTo] = useState("");
  const [lessonScope, setLessonScope] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [obtainedMarks, setObtainedMarks] = useState("");
  const [checkedPaperUrl, setCheckedPaperUrl] = useState("");
  const [registerDate, setRegisterDate] = useState(today);
  const [registerStudentId, setRegisterStudentId] = useState("all");
  const [reportSearch, setReportSearch] = useState("");

  const { data: teacher } = useQuery({
    queryKey: ["teacher-profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/teachers/by-username/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Teacher profile not found");
      return res.json() as Promise<Teacher>;
    },
    enabled: !!username,
  });
  const teacherId = teacher?.id ?? 0;
  const assignments = useMemo(() => parseAssignments(teacher?.teachingAssignments), [teacher]);
  const { data: classSubjects = [] } = useQuery({
    queryKey: ["teacher-class-subjects", selectedClass],
    queryFn: async () => (await fetch(`/api/academic/subjects?class=${encodeURIComponent(selectedClass)}`)).json() as Promise<ClassSubject[]>,
    enabled: !!selectedClass,
  });
  const classes = Array.from(new Set([
    teacher?.assignedClass ?? "",
    ...assignments.map((item) => item.class),
  ].filter(Boolean)));
  const assignmentSubjects = assignments.filter((item) => item.class === selectedClass);
  const subjectsForClass = assignmentSubjects.length > 0
    ? assignmentSubjects
    : classSubjects.map((item) => ({ class: item.class, subject: item.subject }));
  const canMarkStudentAttendance = !!teacher?.assignedClass && teacher.assignedClass === selectedClass;

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(teacher?.assignedClass || classes[0]);
  }, [classes, selectedClass, teacher?.assignedClass]);
  useEffect(() => {
    if (!selectedSubject && subjectsForClass.length > 0) setSelectedSubject(subjectsForClass[0].subject);
  }, [subjectsForClass, selectedSubject]);

  const { data: network } = useQuery({
    queryKey: ["teacher-network-status"],
    queryFn: async () => (await fetch("/api/teacher-portal/network-status")).json() as Promise<{ allowed: boolean; ip: string }>,
  });
  const { data: myAttendance = [] } = useQuery({
    queryKey: ["teacher-attendance", teacherId],
    queryFn: async () => (await fetch(`/api/teacher-portal/${teacherId}/attendance`)).json() as Promise<TeacherAttendance[]>,
    enabled: !!teacherId,
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students-by-class", selectedClass],
    queryFn: async () => (await fetch(`/api/students?class=${encodeURIComponent(selectedClass)}`)).json() as Promise<Student[]>,
    enabled: !!selectedClass,
  });
  const { data: attendanceRows = [] } = useQuery({
    queryKey: ["class-attendance", selectedClass, today],
    queryFn: async () => (await fetch(`/api/attendance?class=${encodeURIComponent(selectedClass)}&date=${today}`)).json() as Promise<AttendanceRow[]>,
    enabled: !!selectedClass,
  });
  const { data: registerRows = [] } = useQuery({
    queryKey: ["class-attendance-register", selectedClass, registerDate],
    queryFn: async () => (await fetch(`/api/attendance?class=${encodeURIComponent(selectedClass)}&date=${registerDate}`)).json() as Promise<AttendanceRow[]>,
    enabled: !!selectedClass && !!registerDate,
  });
  const { data: timetable = [] } = useQuery({
    queryKey: ["teacher-timetable", teacherId],
    queryFn: async () => (await fetch(`/api/academic/timetable?teacherId=${teacherId}`)).json() as Promise<TimetableRow[]>,
    enabled: !!teacherId,
  });
  const { data: papers = [] } = useQuery({
    queryKey: ["teacher-papers", teacherId, selectedClass, selectedSubject],
    queryFn: async () => (await fetch(`/api/teacher-portal/exam-papers?teacherId=${teacherId}&class=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`)).json() as Promise<ExamPaper[]>,
    enabled: !!teacherId && !!selectedClass && !!selectedSubject,
  });
  const { data: results = [] } = useQuery({
    queryKey: ["teacher-results", selectedClass],
    queryFn: async () => (await fetch(`/api/teacher-portal/exams?class=${encodeURIComponent(selectedClass)}&teacherId=${teacherId}`)).json() as Promise<ExamResult[]>,
    enabled: !!teacherId && !!selectedClass,
  });

  useEffect(() => {
    const next: Record<number, boolean> = {};
    attendanceRows.forEach((row) => { next[row.studentId] = row.present; });
    setAttendanceState(next);
  }, [attendanceRows]);

  const presentStudents = Object.values(attendanceState).filter(Boolean).length;
  const absentStudents = students.length ? students.length - presentStudents : 0;
  const presentPercent = students.length ? Math.round((presentStudents / students.length) * 100) : 0;
  const presentToday = myAttendance.some((row) => row.date === today && row.present);
  const todaySchedule = timetable.filter((row) => row.weekday === todayName);
  const selectedPaper = papers.find((paper) => String(paper.id) === selectedPaperId);

  useEffect(() => {
    const moduleName = location.replace(/^\/teacher-portal\/?/, "");
    setView(pathViews[moduleName] ?? "dashboard");
  }, [location]);

  const openView = (next: PortalView) => {
    setView(next);
    setLocation(viewPaths[next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markOwnAttendance = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/teacher-portal/${teacherId}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today }) });
      if (!res.ok) throw new Error((await res.json()).error || "Attendance failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-attendance", teacherId] }); toast({ title: "Marked present", description: "Your own attendance has been saved." }); },
    onError: (error: Error) => toast({ title: "Not allowed", description: error.message, variant: "destructive" }),
  });

  const saveStudentAttendance = useMutation({
    mutationFn: async () => {
      for (const student of students) {
        const existing = attendanceRows.find((row) => row.studentId === student.id);
        const present = attendanceState[student.id] ?? false;
        if (existing?.id) {
          await fetch(`/api/attendance/${existing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ present }) });
        } else {
          await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.id, date: today, present }) });
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-attendance", selectedClass, today] }); toast({ title: "Class attendance saved", description: `${selectedClass} attendance reflected in admin portal.` }); },
    onError: () => toast({ title: "Error", description: "Failed to save class attendance", variant: "destructive" }),
  });

  const createPaper = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teacher-portal/exam-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, title: paperTitle, class: selectedClass, subject: selectedSubject, examType: paperTitle || "Test", totalMarks: Number(totalMarks), chapterFrom, chapterTo, lessonScope, fileUrl: "" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create test");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-papers", teacherId, selectedClass, selectedSubject] }); setPaperTitle(""); toast({ title: "Test saved", description: "Now results can be entered against this test." }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const saveResult = useMutation({
    mutationFn: async () => {
      const paper = papers.find((item) => String(item.id) === selectedPaperId);
      const res = await fetch("/api/teacher-portal/exam-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: Number(selectedStudentId), paperId: Number(selectedPaperId), class: selectedClass, subject: selectedSubject, totalMarks: paper?.totalMarks ?? Number(totalMarks), obtainedMarks: Number(obtainedMarks), checkedPaperUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save result");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-results", selectedClass] }); setSelectedStudentId(""); setObtainedMarks(""); setCheckedPaperUrl(""); toast({ title: "Result saved", description: "Percentage, grade and positions are updated." }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const logout = () => { clearAuth(); setLocation("/login"); };
  const goDashboard = () => openView("dashboard");

  if (!teacher) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading teacher portal...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f2f3f8] text-[#242060]">
      <header className="min-h-16 bg-white shadow-sm flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        {view === "dashboard" ? <div className="w-10" /> : <button onClick={goDashboard} className="rounded-full p-2 hover:bg-slate-100"><ArrowLeft className="w-6 h-6 text-slate-900" /></button>}
        <h1 className="text-xl md:text-3xl font-light tracking-wide text-center flex-1">PGC TEACHER APP</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="sm" onClick={() => openView("schedule")} className="gap-2"><CalendarDays className="w-4 h-4" /> <span className="hidden sm:inline">Timetable</span></Button>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-2"><LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span></Button>
        </div>
      </header>

      <main className="p-3 md:p-6 space-y-4 md:space-y-6">
        {view === "dashboard" && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 md:gap-6">
              <Card className="shadow-sm">
                <CardContent className="p-4 md:p-5 space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-700"><span>{format(new Date(), "EEE d MMM yyyy")}</span><span>{format(new Date(), "hh:mm a")}</span></div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-200 grid place-items-center shrink-0"><UserRoundCheck className="w-8 h-8 md:w-10 md:h-10 text-white" /></div>
                    <div className="min-w-0"><div className="text-xl md:text-2xl font-bold truncate">{teacher.name}</div><div className="text-red-500 text-sm truncate">{username}</div></div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Select value={selectedClass} onValueChange={(value) => { setSelectedClass(value); setSelectedSubject(""); }}>
                      <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                      <SelectContent className="max-h-72">{classes.map((item) => <SelectItem key={item} value={item}>{item}{teacher.assignedClass === item ? " (Incharge)" : ""}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={() => markOwnAttendance.mutate()} disabled={!network?.allowed || presentToday || markOwnAttendance.isPending} className="bg-[#242060] hover:bg-[#1b184b]">
                      {presentToday ? "My Attendance Marked" : "Mark My Attendance"}
                    </Button>
                    <div className="text-xs text-muted-foreground">{network?.allowed ? "School network allowed for own attendance." : "Own attendance locked outside school network."}</div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                <ActionCard title="Student Reports" icon={<BarChart3 />} onClick={() => openView("studentReport")} />
                <ActionCard title="Upload Result" icon={<FileUp />} onClick={() => openView("uploadResult")} />
                <ActionCard title="Academic Calendar" icon={<CalendarDays />} onClick={() => openView("schedule")} />
                <ActionCard title="Mark Attendance" icon={<UserRoundCheck />} onClick={() => canMarkStudentAttendance ? openView("attendance") : toast({ title: "Only incharge can mark attendance", description: "You can mark attendance only for your incharge class.", variant: "destructive" })} />
                <ActionCard title="Mark Exam" icon={<BookOpen />} onClick={() => openView("exam")} />
                <ActionCard title="Attendance Register" icon={<ClipboardList />} onClick={() => openView("register")} />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 md:gap-6">
              <ScheduleCard title="Today's Classes" rows={todaySchedule} onViewAll={() => openView("schedule")} />
              {canMarkStudentAttendance && (
                <Card className="shadow-sm">
                  <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(#242060 ${presentPercent * 3.6}deg, #ef3b2d 0deg)` }}>
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white grid place-items-center text-center"><strong className="text-2xl md:text-3xl">{presentPercent}%</strong><span className="text-xs">Present</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1 w-full">
                      <div className="rounded-lg bg-emerald-50 p-4 md:p-5"><div className="text-3xl md:text-4xl font-bold text-emerald-600">{presentStudents}</div><div className="text-sm md:text-base">Present Today</div></div>
                      <div className="rounded-lg bg-red-50 p-4 md:p-5"><div className="text-3xl md:text-4xl font-bold text-red-500">{absentStudents}</div><div className="text-sm md:text-base">Absent Today</div></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {view === "schedule" && <TimetableView rows={timetable} />}
        {view === "register" && (
          <RegisterView
            selectedClass={selectedClass}
            students={students}
            rows={registerRows}
            registerDate={registerDate}
            setRegisterDate={setRegisterDate}
            registerStudentId={registerStudentId}
            setRegisterStudentId={setRegisterStudentId}
          />
        )}
        {view === "attendance" && (
          <AttendanceView
            selectedClass={selectedClass}
            selectedSubject={selectedSubject}
            today={today}
            students={students}
            state={attendanceState}
            setState={setAttendanceState}
            onSave={() => saveStudentAttendance.mutate()}
            saving={saveStudentAttendance.isPending}
          />
        )}
        {view === "exam" && (
          <ExamView
            selectedClass={selectedClass}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            subjects={subjectsForClass}
            paperTitle={paperTitle}
            setPaperTitle={setPaperTitle}
            totalMarks={totalMarks}
            setTotalMarks={setTotalMarks}
            chapterFrom={chapterFrom}
            setChapterFrom={setChapterFrom}
            chapterTo={chapterTo}
            setChapterTo={setChapterTo}
            lessonScope={lessonScope}
            setLessonScope={setLessonScope}
            onCreate={() => createPaper.mutate()}
            creating={createPaper.isPending}
          />
        )}
        {view === "uploadResult" && (
          <UploadResultView
            selectedClass={selectedClass}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            subjects={subjectsForClass}
            papers={papers}
            selectedPaperId={selectedPaperId}
            setSelectedPaperId={setSelectedPaperId}
            students={students}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            obtainedMarks={obtainedMarks}
            setObtainedMarks={setObtainedMarks}
            setCheckedPaperUrl={setCheckedPaperUrl}
            selectedPaper={selectedPaper}
            onSave={() => saveResult.mutate()}
            saving={saveResult.isPending}
          />
        )}
        {view === "studentReport" && (
          <StudentReportView
            search={reportSearch}
            setSearch={setReportSearch}
            results={results}
          />
        )}
      </main>
    </div>
  );
}

function ActionCard({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="bg-white rounded-lg shadow-sm p-4 md:p-5 text-left min-h-28 md:min-h-32 hover:shadow-md transition-shadow border border-slate-100"><div className="text-[#242060] [&_svg]:w-8 [&_svg]:h-8 md:[&_svg]:w-10 md:[&_svg]:h-10">{icon}</div><div className="font-bold mt-4 text-sm md:text-base leading-tight">{title}</div><div className="w-12 h-1 bg-[#242060] mt-3 rounded-full" /></button>;
}

function BigTile({ title, icon, onClick, disabled }: { title: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="bg-white rounded-lg shadow-sm min-h-52 md:min-h-72 grid place-items-center p-5 md:p-8 disabled:opacity-50 border border-slate-100"><div className="text-center text-[#242060]"><div className="mx-auto rounded-full bg-[#eeeeF6] w-28 h-28 md:w-40 md:h-40 grid place-items-center text-[#242060]">{icon}</div><div className="text-xl md:text-3xl font-bold mt-5 md:mt-8">{title}</div></div></button>;
}

function ScheduleCard({ title, rows, onViewAll }: { title: string; rows: TimetableRow[]; onViewAll: () => void }) {
  return <Card className="shadow-sm"><CardHeader className="p-4 md:p-6"><div className="flex items-center justify-between gap-3"><div className="text-xl md:text-2xl font-bold">{title}<div className="w-20 h-1 bg-red-500 mt-2 rounded-full" /></div><Button size="sm" className="rounded-full bg-[#242060] shrink-0" onClick={onViewAll}>View All</Button></div></CardHeader><CardContent className="p-4 md:p-6 pt-0 space-y-4">{rows.length === 0 ? <div className="text-muted-foreground text-sm">No lectures today.</div> : rows.map((row) => <div key={row.id} className="grid grid-cols-[80px_1fr] gap-3 items-center text-sm"><span className="text-slate-400 text-xs">{row.startTime}-{row.endTime}</span><div className="rounded-md bg-[#f2f1fb] px-3 py-3 leading-tight">{row.class} - {row.subject}</div></div>)}</CardContent></Card>;
}

function TimetableView({ rows }: { rows: TimetableRow[] }) {
  const [day, setDay] = useState(format(new Date(), "EEEE"));
  const dayRows = rows.filter((row) => row.weekday === day);
  return <div className="space-y-4 md:space-y-6"><div className="flex justify-start md:justify-center gap-2 md:gap-4 overflow-x-auto pb-2">{weekdays.map((item) => <Button key={item} size="sm" onClick={() => setDay(item)} className={`rounded-full px-5 md:px-8 shrink-0 ${day === item ? "bg-[#242060]" : "bg-white text-muted-foreground hover:bg-white"}`}>{item.toUpperCase()}</Button>)}</div><Card className="shadow-sm"><CardContent className="p-4 md:p-8"><h2 className="text-2xl md:text-4xl font-bold mb-6">{day}<div className="w-20 h-1 bg-red-500 mt-3 rounded-full" /></h2><div className="space-y-4 md:space-y-6">{dayRows.length === 0 ? <div className="text-muted-foreground">No timetable entries for this day.</div> : dayRows.map((row, index) => <div key={row.id} className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-6 md:items-center"><div className="text-sm md:text-lg text-slate-500">{row.startTime}-{row.endTime}</div><div className={`rounded-lg px-4 md:px-6 py-4 text-base md:text-xl leading-snug ${index === 1 ? "bg-[#242060] text-white" : "bg-sky-50 text-slate-900"}`}>{row.class} - {row.subject} - Lecture</div></div>)}</div></CardContent></Card></div>;
}

function AttendanceView({ selectedClass, selectedSubject, today, students, state, setState, onSave, saving }: { selectedClass: string; selectedSubject: string; today: string; students: Student[]; state: Record<number, boolean>; setState: React.Dispatch<React.SetStateAction<Record<number, boolean>>>; onSave: () => void; saving: boolean }) {
  const present = Object.values(state).filter(Boolean).length;
  const absent = students.length - present;
  return <Card className="shadow-sm"><CardHeader className="bg-sky-50 p-4"><div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 lg:gap-5 items-center"><div><div className="font-bold">{format(new Date(today), "EEEE")}</div><div className="text-sm text-muted-foreground">{format(new Date(today), "dd-MM-yyyy")}</div></div><div className="text-sm">Class: <strong>{selectedClass}</strong></div><div className="text-sm">Subject: <strong>{selectedSubject || "-"}</strong></div><div className="flex flex-wrap gap-2 items-center"><label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm">All Present <input type="checkbox" onChange={(e) => { const next: Record<number, boolean> = {}; students.forEach((s) => { next[s.id] = e.target.checked; }); setState(next); }} /></label><span className="rounded-full bg-[#242060] text-white px-3 py-2 text-sm">{present} Present</span><span className="rounded-full bg-red-500 text-white px-3 py-2 text-sm">{absent} Absent</span><Button onClick={onSave} disabled={saving} className="rounded-full bg-[#242060] px-6">Save</Button></div></div></CardHeader><CardContent className="p-3 md:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{students.map((student) => { const isPresent = state[student.id] ?? false; return <div key={student.id} className={`border-l-4 ${isPresent ? "border-[#242060]" : "border-red-500"} bg-white px-4 py-3 flex items-center justify-between gap-3 shadow-sm rounded-r-md`}><div className="min-w-0"><div className="text-base md:text-lg truncate">{student.name}</div><div className="text-sm text-muted-foreground truncate">{student.rollNumber}</div></div><button onClick={() => setState((old) => ({ ...old, [student.id]: !isPresent }))} className={`w-16 h-8 rounded-full flex items-center px-1 shrink-0 ${isPresent ? "bg-slate-200 justify-end" : "bg-red-100 justify-start"}`}><span className={`w-7 h-7 rounded-full ${isPresent ? "bg-[#242060]" : "bg-red-500"}`} /></button></div>; })}</CardContent></Card>;
}

function RegisterView(props: { selectedClass: string; students: Student[]; rows: AttendanceRow[]; registerDate: string; setRegisterDate: (v: string) => void; registerStudentId: string; setRegisterStudentId: (v: string) => void }) {
  const filtered = props.registerStudentId === "all" ? props.rows : props.rows.filter((row) => String(row.studentId) === props.registerStudentId);
  const present = filtered.filter((row) => row.present).length;
  const absent = filtered.length - present;
  return <Card className="shadow-sm"><CardHeader className="p-4 md:p-6"><div className="text-xl md:text-2xl font-bold">Attendance Register</div></CardHeader><CardContent className="p-4 md:p-6 pt-0 space-y-4"><div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3 md:gap-4"><Input type="date" value={props.registerDate} onChange={(e) => props.setRegisterDate(e.target.value)} /><Select value={props.registerStudentId} onValueChange={props.setRegisterStudentId}><SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger><SelectContent className="max-h-72"><SelectItem value="all">All Students</SelectItem>{props.students.map((student) => <SelectItem key={student.id} value={String(student.id)}>{student.rollNumber} - {student.name}</SelectItem>)}</SelectContent></Select><div className="flex gap-2 md:gap-3"><span className="rounded-full bg-[#242060] text-white px-3 md:px-4 py-2 text-sm whitespace-nowrap">{present} Present</span><span className="rounded-full bg-red-500 text-white px-3 md:px-4 py-2 text-sm whitespace-nowrap">{absent} Absent</span></div></div><div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[560px] text-sm"><thead className="bg-muted text-left"><tr><th className="px-4 py-3">Roll No</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y">{filtered.map((row) => <tr key={row.studentId}><td className="px-4 py-3">{row.rollNumber}</td><td className="px-4 py-3 font-medium">{row.studentName}</td><td className="px-4 py-3">{props.selectedClass}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${row.present ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{row.present ? "Present" : "Absent"}</span></td></tr>)}</tbody></table></div></CardContent></Card>;
}

function ExamView(props: { selectedClass: string; selectedSubject: string; setSelectedSubject: (v: string) => void; subjects: AssignmentRow[]; paperTitle: string; setPaperTitle: (v: string) => void; totalMarks: string; setTotalMarks: (v: string) => void; chapterFrom: string; setChapterFrom: (v: string) => void; chapterTo: string; setChapterTo: (v: string) => void; lessonScope: string; setLessonScope: (v: string) => void; onCreate: () => void; creating: boolean }) {
  return <Card className="shadow-sm"><CardHeader className="p-4 md:p-6"><div className="text-xl md:text-2xl font-bold">Create Test / Exam</div></CardHeader><CardContent className="p-4 md:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"><Input value={props.paperTitle} onChange={(e) => props.setPaperTitle(e.target.value)} placeholder="Title: Class Test 1 / Mid Term / Final" /><Select value={props.selectedSubject} onValueChange={props.setSelectedSubject}><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent>{props.subjects.map((item) => <SelectItem key={item.subject} value={item.subject}>{item.subject}</SelectItem>)}</SelectContent></Select><Input value={props.totalMarks} onChange={(e) => props.setTotalMarks(e.target.value)} type="number" placeholder="Total marks" /><Input value={props.chapterFrom} onChange={(e) => props.setChapterFrom(e.target.value)} placeholder="Chapter from" /><Input value={props.chapterTo} onChange={(e) => props.setChapterTo(e.target.value)} placeholder="Chapter to / same chapter" /><Input value={props.lessonScope} onChange={(e) => props.setLessonScope(e.target.value)} placeholder="Lesson / chapter scope" /><Button onClick={props.onCreate} disabled={props.creating || !props.paperTitle || !props.selectedClass || !props.selectedSubject} className="bg-[#242060] md:col-span-2">Save Test</Button></CardContent></Card>;
}

function UploadResultView(props: { selectedClass: string; selectedSubject: string; setSelectedSubject: (v: string) => void; subjects: AssignmentRow[]; papers: ExamPaper[]; selectedPaperId: string; setSelectedPaperId: (v: string) => void; students: Student[]; selectedStudentId: string; setSelectedStudentId: (v: string) => void; obtainedMarks: string; setObtainedMarks: (v: string) => void; setCheckedPaperUrl: (v: string) => void; selectedPaper?: ExamPaper; onSave: () => void; saving: boolean }) {
  return <Card className="shadow-sm">
    <CardHeader className="p-4 md:p-6">
      <div className="text-xl md:text-2xl font-bold">Upload Result / Checked Paper</div>
      <div className="text-sm text-muted-foreground">Choose test, student, marks, then upload checked paper image or PDF.</div>
    </CardHeader>
    <CardContent className="p-4 md:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
      <Select value={props.selectedSubject} onValueChange={props.setSelectedSubject}>
        <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
        <SelectContent className="max-h-72">{props.subjects.map((item) => <SelectItem key={item.subject} value={item.subject}>{item.subject}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={props.selectedPaperId} onValueChange={props.setSelectedPaperId}>
        <SelectTrigger><SelectValue placeholder="Test / Exam" /></SelectTrigger>
        <SelectContent className="max-h-72">{props.papers.map((paper) => <SelectItem key={paper.id} value={String(paper.id)}>{paper.title}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={props.selectedStudentId} onValueChange={props.setSelectedStudentId}>
        <SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
        <SelectContent className="max-h-72">{props.students.map((student) => <SelectItem key={student.id} value={String(student.id)}>{student.rollNumber} - {student.name}</SelectItem>)}</SelectContent>
      </Select>
      <Input value={props.obtainedMarks} onChange={(e) => props.setObtainedMarks(e.target.value)} type="number" placeholder={`Obtained / ${props.selectedPaper?.totalMarks ?? "marks"}`} />
      <Input type="file" accept="image/*,.pdf" capture="environment" onChange={async (e) => { const file = e.target.files?.[0]; if (file) props.setCheckedPaperUrl(await fileToDataUrl(file)); }} />
      <Button onClick={props.onSave} disabled={props.saving || !props.selectedPaperId || !props.selectedStudentId || !props.obtainedMarks} className="bg-[#242060]">Save Result</Button>
    </CardContent>
  </Card>;
}

function StudentReportView(props: { search: string; setSearch: (v: string) => void; results: ExamResult[] }) {
  const term = props.search.trim().toLowerCase();
  const filtered = term
    ? props.results.filter((row) => `${row.studentName} ${row.rollNumber}`.toLowerCase().includes(term))
    : [];

  return <Card className="shadow-sm">
    <CardHeader className="p-4 md:p-6">
      <div className="text-xl md:text-2xl font-bold">Student Report</div>
      <div className="text-sm text-muted-foreground">Search by student name or roll number.</div>
    </CardHeader>
    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={props.search} onChange={(e) => props.setSearch(e.target.value)} placeholder="Search name or roll number" className="pl-10" />
      </div>
      {!term && <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">Enter name or roll number to open a student report.</div>}
      {term && filtered.length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">No report found for this search.</div>}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-lg border bg-white p-4 md:p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="text-lg font-bold">{row.studentName}</div>
                  <div className="text-sm text-muted-foreground">{row.rollNumber} - {row.class}</div>
                </div>
                <div className="rounded-full bg-[#242060] text-white px-3 py-1 text-sm w-fit">{row.percentage}%</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-3"><div className="text-muted-foreground">Test</div><div className="font-medium">{row.paperTitle ?? row.subject}</div></div>
                <div className="rounded-md bg-slate-50 p-3"><div className="text-muted-foreground">Subject</div><div className="font-medium">{row.subject}</div></div>
                <div className="rounded-md bg-slate-50 p-3"><div className="text-muted-foreground">Marks</div><div className="font-medium">{row.obtainedMarks}/{row.totalMarks}</div></div>
                <div className="rounded-md bg-slate-50 p-3"><div className="text-muted-foreground">Grade</div><div className="font-medium">{row.grade}{row.position ? ` - Position ${row.position}` : ""}</div></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.paperUrl && <Button size="sm" variant="outline" onClick={() => window.open(row.paperUrl ?? "", "_blank")}>Checked Paper</Button>}
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>;
}
