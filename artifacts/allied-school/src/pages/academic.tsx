import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, CalendarClock, ClipboardCheck, FileUp, GraduationCap, Search, Send, Sheet, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type Teacher = {
  id: number;
  name: string;
  assignedClass: string | null;
  subjectsTaught: string;
  teachingAssignments?: string;
};

type ClassSubject = {
  id: number;
  class: string;
  subject: string;
  bookName: string;
};

type AssignmentRow = {
  class: string;
  subject: string;
};

type TimetableRow = {
  id: number;
  teacherId: number;
  teacherName: string;
  class: string;
  subject: string;
  weekday: string;
  startTime: string;
  endTime: string;
};

type SyllabusPlan = {
  id: number;
  class: string;
  subject: string;
  planDate: string;
  chapterName: string;
  lesson: string;
  contentScope: string;
};

const examTypes = ["Mid-Term", "Final", "Class Test", "Monthly Test"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const grades = [
  { min: 90, grade: "A+" },
  { min: 80, grade: "A" },
  { min: 70, grade: "B" },
  { min: 60, grade: "C" },
  { min: 50, grade: "D" },
  { min: 0, grade: "F" },
];

function gradeFor(percentage: number) {
  return grades.find((g) => percentage >= g.min)?.grade ?? "F";
}

function parseAssignments(value: string | undefined | null): AssignmentRow[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as AssignmentRow[];
  } catch {
    return value.split(";").map((item) => {
      const [klass, subject] = item.split(":");
      return { class: klass?.trim() ?? "", subject: subject?.trim() ?? "" };
    }).filter((row) => row.class && row.subject);
  }
}

export default function AcademicPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [timetableClass, setTimetableClass] = useState("");
  const [timetableSubject, setTimetableSubject] = useState("");
  const [weekday, setWeekday] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:40");
  const [examClass, setExamClass] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [obtainedMarks, setObtainedMarks] = useState("0");
  const [planClass, setPlanClass] = useState("");
  const [planSubject, setPlanSubject] = useState("");
  const [planDate, setPlanDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [chapterName, setChapterName] = useState("");
  const [lesson, setLesson] = useState("");
  const [contentScope, setContentScope] = useState("");

  const { data: classesList = [] } = useQuery({
    queryKey: ["students-classes"],
    queryFn: async () => {
      const res = await fetch("/api/students/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json() as Promise<string[]>;
    },
  });
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json() as Promise<Teacher[]>;
    },
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["academic-subjects-all"],
    queryFn: async () => {
      const res = await fetch("/api/academic/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json() as Promise<ClassSubject[]>;
    },
  });
  const { data: timetable = [] } = useQuery({
    queryKey: ["academic-timetable", selectedTeacherId],
    queryFn: async () => {
      const suffix = selectedTeacherId ? `?teacherId=${selectedTeacherId}` : "";
      const res = await fetch(`/api/academic/timetable${suffix}`);
      if (!res.ok) throw new Error("Failed to fetch timetable");
      return res.json() as Promise<TimetableRow[]>;
    },
  });
  const { data: syllabusPlans = [] } = useQuery({
    queryKey: ["academic-syllabus", planClass, planSubject],
    queryFn: async () => {
      const res = await fetch(`/api/academic/syllabus?class=${encodeURIComponent(planClass)}&subject=${encodeURIComponent(planSubject)}`);
      if (!res.ok) throw new Error("Failed to fetch syllabus");
      return res.json() as Promise<SyllabusPlan[]>;
    },
  });
  const { data: autoTeacher } = useQuery({
    queryKey: ["teacher-for-subject", planClass, planSubject],
    queryFn: async () => {
      const res = await fetch(`/api/academic/teacher-for-subject?class=${encodeURIComponent(planClass)}&subject=${encodeURIComponent(planSubject)}`);
      if (!res.ok) throw new Error("Failed to fetch teacher");
      return res.json() as Promise<Teacher | null>;
    },
    enabled: !!planClass && !!planSubject,
  });

  const selectedTeacher = teachers.find((teacher) => String(teacher.id) === selectedTeacherId) ?? null;
  const selectedTeacherAssignments = parseAssignments(selectedTeacher?.teachingAssignments);
  const subjectsForClass = (studentClass: string) => subjects.filter((item) => item.class === studentClass);
  const percentage = useMemo(() => {
    const total = Number(totalMarks) || 0;
    const obtained = Number(obtainedMarks) || 0;
    return total > 0 ? Math.round((obtained / total) * 100) : 0;
  }, [totalMarks, obtainedMarks]);

  const saveTimetable = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/academic/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: Number(selectedTeacherId),
          class: timetableClass,
          subject: timetableSubject,
          weekday,
          startTime,
          endTime,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save timetable");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-timetable"] });
      toast({ title: "Timetable saved", description: "Teacher lecture mapping added." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const saveSyllabus = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/academic/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: planClass, subject: planSubject, planDate, chapterName, lesson, contentScope }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save plan");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-syllabus", planClass, planSubject] });
      setChapterName("");
      setLesson("");
      setContentScope("");
      toast({ title: "Planning saved", description: `${planClass} ${planSubject} plan added.` });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Academic Hub</h1>
        <p className="text-muted-foreground mt-1">Timetable, teacher portal, exams, syllabus, and diary dispatch.</p>
      </div>

      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="syllabus">Planning</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-2 font-semibold"><CalendarClock className="w-5 h-5 text-primary" /> Multi-Class Timetable Assignment</div>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Teacher</Label>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent className="max-h-72">{teachers.map((teacher) => <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Class</Label>
                  <Select value={timetableClass} onValueChange={(value) => { setTimetableClass(value); setTimetableSubject(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent className="max-h-72">{classesList.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={timetableSubject} onValueChange={setTimetableSubject} disabled={!timetableClass}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent className="max-h-72">{subjectsForClass(timetableClass).map((item) => <SelectItem key={item.id} value={item.subject}>{item.subject}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Day</Label>
                  <Select value={weekday} onValueChange={setWeekday}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{weekdays.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button className="gap-2" onClick={() => saveTimetable.mutate()} disabled={!selectedTeacherId || !timetableClass || !timetableSubject || saveTimetable.isPending}>
                    <ClipboardCheck className="w-4 h-4" /> Save Mapping
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b bg-muted/20">
                <div className="font-semibold">Teacher Timetable Search</div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {timetable.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No timetable entries found.</div>
                ) : timetable.map((row) => (
                  <div key={row.id} className="rounded-md border p-3 text-sm">
                    <div className="font-semibold">{row.weekday} - {row.startTime} to {row.endTime}</div>
                    <div className="text-muted-foreground">{row.teacherName} teaches {row.subject} to {row.class}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teacher">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-3">
              <CardContent className="p-5 flex flex-col md:flex-row gap-4 md:items-end">
                <div className="space-y-1.5 w-full md:w-80">
                  <Label>Search Teacher</Label>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent className="max-h-72">{teachers.map((teacher) => <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {selectedTeacher?.assignedClass && (
                  <div className="rounded-md border bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Incharge Class: <strong>{selectedTeacher.assignedClass}</strong>
                  </div>
                )}
              </CardContent>
            </Card>
            {["Mark Attendance", "Mark Exam", "Attendance Register", "Exam Report"].map((item) => (
              <Card key={item} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary grid place-items-center"><GraduationCap className="w-5 h-5" /></div>
                  <div className="font-semibold">{item}</div>
                </CardContent>
              </Card>
            ))}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-2 font-semibold"><CalendarClock className="w-5 h-5 text-primary" /> Assigned Classes & Timetable</div>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTeacherAssignments.map((row) => (
                  <div key={`${row.class}-${row.subject}`} className="rounded-md border bg-card p-3 text-sm font-medium">{row.class} - {row.subject}</div>
                ))}
                {timetable.map((slot) => (
                  <div key={slot.id} className="rounded-md border bg-muted/30 p-3 text-sm">{slot.weekday} {slot.startTime} - {slot.class} {slot.subject}</div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exams">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-2 font-semibold"><FileUp className="w-5 h-5 text-primary" /> Upload Exam Paper</div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <Input placeholder="Paper title" />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={examClass} onValueChange={(value) => { setExamClass(value); setExamSubject(""); }}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent className="max-h-72">{classesList.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={examSubject} onValueChange={setExamSubject} disabled={!examClass}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent className="max-h-72">{subjectsForClass(examClass).map((item) => <SelectItem key={item.id} value={item.subject}>{item.subject}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select defaultValue={examTypes[0]}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{examTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="file" accept="image/*,.pdf" capture="environment" />
                </div>
                <Button className="gap-2"><FileUp className="w-4 h-4" /> Upload Paper</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-2 font-semibold"><Trophy className="w-5 h-5 text-primary" /> Result Entry</div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Roll number" value={studentRoll} onChange={(e) => setStudentRoll(e.target.value)} />
                  <Select value={examSubject} onValueChange={setExamSubject} disabled={!examClass}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent className="max-h-72">{subjectsForClass(examClass).map((item) => <SelectItem key={item.id} value={item.subject}>{item.subject}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Total marks" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
                  <Input type="number" placeholder="Obtained marks" value={obtainedMarks} onChange={(e) => setObtainedMarks(e.target.value)} />
                </div>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  Percentage: <strong>{percentage}%</strong> | Grade: <strong>{gradeFor(percentage)}</strong> | Status: <strong>{percentage >= 50 ? "Pass" : "Fail"}</strong>
                </div>
                <Button className="gap-2"><Search className="w-4 h-4" /> Search / Print Result</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="syllabus">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center gap-2 font-semibold"><BookOpen className="w-5 h-5 text-primary" /> Monthly Syllabus Planning</div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={planClass} onValueChange={(value) => { setPlanClass(value); setPlanSubject(""); }}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent className="max-h-72">{classesList.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={planSubject} onValueChange={setPlanSubject} disabled={!planClass}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent className="max-h-72">{subjectsForClass(planClass).map((item) => <SelectItem key={item.id} value={item.subject}>{item.subject}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={autoTeacher?.name ?? ""} readOnly placeholder="Teacher auto-selected" />
                <Input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
                <Input placeholder="Chapter" value={chapterName} onChange={(event) => setChapterName(event.target.value)} />
                <Input placeholder="Lesson" value={lesson} onChange={(event) => setLesson(event.target.value)} />
                <Input className="md:col-span-2" placeholder="Planning details / diary text" value={contentScope} onChange={(event) => setContentScope(event.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => saveSyllabus.mutate()} disabled={!planClass || !planSubject || !chapterName || !lesson || saveSyllabus.isPending}>
                  <Send className="w-4 h-4" /> Save Plan
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {syllabusPlans.map((plan) => (
                  <div key={plan.id} className="rounded-md border p-3 text-sm">
                    <div className="font-semibold">{plan.planDate} - {plan.chapterName}</div>
                    <div className="text-muted-foreground">{plan.class} {plan.subject}: {plan.lesson}</div>
                    {plan.contentScope && <div className="mt-1 text-muted-foreground">{plan.contentScope}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center gap-2 font-semibold"><Sheet className="w-5 h-5 text-primary" /> Google Sheets / WhatsApp / SMS Config</div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Google Sheet ID" />
              <Input placeholder="Google Service Account Email" />
              <Input placeholder="WhatsApp API URL" />
              <Input placeholder="SMS Gateway API URL" />
              <div className="md:col-span-2 flex justify-end">
                <Button variant="secondary">Save Integration Config</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
