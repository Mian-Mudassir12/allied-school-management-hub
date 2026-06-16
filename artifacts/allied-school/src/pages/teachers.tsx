import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, Phone, MapPin, Calendar, DollarSign, BookOpen,
  Plus, Pencil, Trash2, UserX, UserCheck, Search,
} from "lucide-react";

type Teacher = {
  id: number;
  name: string;
  phone: string;
  mobileNumber?: string | null;
  homeNumber?: string | null;
  whatsappNumber?: string | null;
  qualification?: string;
  address: string | null;
  joiningDate: string;
  monthlySalary: number;
  subjectsTaught: string;
  assignedClass: string | null;
  teachingAssignments?: string;
  timetableNotes?: string;
  portalUsername?: string | null;
  portalPassword?: string | null;
  isActive: boolean;
  createdAt: string;
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

type FormData = {
  name: string;
  phone: string;
  mobileNumber: string;
  homeNumber: string;
  whatsappNumber: string;
  qualification: string;
  address: string;
  joiningDate: string;
  monthlySalary: string;
  subjectsTaught: string;
  assignedClass: string;
  teachingAssignments: string;
  timetableNotes: string;
  portalUsername: string;
  portalPassword: string;
};

const EMPTY: FormData = {
  name: "",
  phone: "+92",
  mobileNumber: "+92",
  homeNumber: "+92",
  whatsappNumber: "+92",
  qualification: "",
  address: "",
  joiningDate: "",
  monthlySalary: "",
  subjectsTaught: "",
  assignedClass: "",
  teachingAssignments: "",
  timetableNotes: "",
  portalUsername: "",
  portalPassword: "",
};

const phoneRegex = /^\+92\d{10}$/;

async function fetchTeachers(): Promise<Teacher[]> {
  const res = await fetch("/api/teachers");
  if (!res.ok) throw new Error("Failed to fetch teachers");
  return res.json();
}

async function fetchClasses(): Promise<string[]> {
  const res = await fetch("/api/students/classes");
  if (!res.ok) throw new Error("Failed to fetch classes");
  return res.json();
}

async function fetchAllSubjects(): Promise<ClassSubject[]> {
  const res = await fetch("/api/academic/subjects");
  if (!res.ok) throw new Error("Failed to fetch subjects");
  return res.json();
}

function parseAssignments(value: string | undefined | null): AssignmentRow[] {
  if (!value) return [{ class: "", subject: "" }];
  try {
    const parsed = JSON.parse(value) as AssignmentRow[];
    return parsed.length ? parsed : [{ class: "", subject: "" }];
  } catch {
    return value.split(";").map((item) => {
      const [klass, subject] = item.split(":");
      return { class: klass?.trim() ?? "", subject: subject?.trim() ?? "" };
    }).filter((row) => row.class || row.subject);
  }
}

export default function TeachersPage() {
  const admin = isAdmin();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([{ class: "", subject: "" }]);
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const { data: teachers = [], isLoading } = useQuery({ queryKey: ["teachers"], queryFn: fetchTeachers });
  const { data: classesList = [] } = useQuery({ queryKey: ["students-classes"], queryFn: fetchClasses });
  const { data: classSubjects = [] } = useQuery({ queryKey: ["academic-subjects-all"], queryFn: fetchAllSubjects });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!phoneRegex.test(data.mobileNumber)) throw new Error("Mobile Number must be like +923700572988");
      if (data.homeNumber !== "+92" && !phoneRegex.test(data.homeNumber)) throw new Error("Home Number must be like +923700572988");
      if (data.whatsappNumber !== "+92" && !phoneRegex.test(data.whatsappNumber)) throw new Error("WhatsApp Number must be like +923700572988");
      const body = {
        ...data,
        teachingAssignments: JSON.stringify(assignmentRows.filter((row) => row.class && row.subject)),
        subjectsTaught: Array.from(new Set(assignmentRows.map((row) => row.subject).filter(Boolean))).join(", "),
        phone: data.mobileNumber,
        monthlySalary: parseInt(data.monthlySalary) || 0,
        assignedClass: data.assignedClass || null,
        address: data.address || null,
        homeNumber: data.homeNumber === "+92" ? "" : data.homeNumber,
        whatsappNumber: data.whatsappNumber === "+92" ? "" : data.whatsappNumber,
      };
      const url = editing ? `/api/teachers/${editing.id}` : "/api/teachers";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: editing ? "Teacher updated" : "Teacher enrolled!", description: editing ? "Record updated." : "New teacher added successfully." });
      setShowDialog(false); setEditing(null); setForm(EMPTY);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/teachers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); toast({ title: "Teacher removed" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setAssignmentRows([{ class: "", subject: "" }]); setShowDialog(true); };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    setAssignmentRows(parseAssignments(t.teachingAssignments));
    setForm({
      name: t.name,
      phone: t.phone,
      mobileNumber: t.mobileNumber || t.phone,
      homeNumber: t.homeNumber || "+92",
      whatsappNumber: t.whatsappNumber || "+92",
      qualification: t.qualification || "",
      address: t.address || "",
      joiningDate: t.joiningDate,
      monthlySalary: String(t.monthlySalary),
      subjectsTaught: t.subjectsTaught,
      assignedClass: t.assignedClass || "",
      teachingAssignments: t.teachingAssignments || "",
      timetableNotes: t.timetableNotes || "",
      portalUsername: t.portalUsername || "",
      portalPassword: t.portalPassword || "",
    });
    setShowDialog(true);
  };

  const filtered = teachers.filter(t => {
    if (filterStatus === "active" && !t.isActive) return false;
    if (filterStatus === "inactive" && t.isActive) return false;
    const assignments = parseAssignments(t.teachingAssignments);
    if (filterClass !== "all" && t.assignedClass !== filterClass && !assignments.some((row) => row.class === filterClass)) return false;
    if (teacherSearch.trim()) {
      const needle = teacherSearch.trim().toLowerCase();
      const haystack = `${t.name} ${t.subjectsTaught} ${t.teachingAssignments ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const activeCount = teachers.filter(t => t.isActive).length;
  const assignedCount = teachers.filter(t => t.isActive && t.assignedClass).length;
  const totalSalary = teachers.filter(t => t.isActive).reduce((s, t) => s + t.monthlySalary, 0);
  const subjectOptionsFor = (studentClass: string) => classSubjects.filter((item) => item.class === studentClass);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Teachers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} active &bull; {teachers.length} total enrolled</p>
        </div>
        {admin && <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Enroll Teacher</Button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Teachers", value: activeCount, color: "bg-primary/5", textColor: "" },
          { label: "Classes Assigned", value: assignedCount, color: "bg-green-50", textColor: "text-green-700" },
          { label: "Unassigned", value: activeCount - assignedCount, color: "bg-amber-50", textColor: "text-amber-700" },
          { label: "Total Salary/Mo.", value: `Rs. ${totalSalary.toLocaleString()}`, color: "bg-slate-50", textColor: "text-slate-600" },
        ].map((stat) => (
          <Card key={stat.label} className={`${stat.color} border-none`}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold font-mono ${stat.textColor}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name or subject..."
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classesList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground animate-pulse">Loading teachers...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No teachers found</p>
            {admin && <p className="text-sm mt-1">Click "Enroll Teacher" to add the first teacher.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => (
            <TeacherCard key={t.id} teacher={t} teachers={teachers} admin={admin}
              onEdit={() => openEdit(t)}
              onToggle={() => toggleMutation.mutate({ id: t.id, isActive: !t.isActive })}
              onDelete={() => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={open => { if (!open) { setShowDialog(false); setEditing(null); setForm(EMPTY); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Teacher" : "Enroll New Teacher"}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="Ms. Ayesha Bibi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile Number *</Label>
                <Input placeholder="+923700572988" value={form.mobileNumber} onChange={e => setForm(f => ({ ...f, mobileNumber: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Home Number</Label>
                <Input placeholder="+923001234567" value={form.homeNumber} onChange={e => setForm(f => ({ ...f, homeNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp Number</Label>
                <Input placeholder="+923001234567" value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Qualification</Label>
                <Input placeholder="M.A English, B.Ed" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Joining Date *</Label>
                <Input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Salary (Rs.) *</Label>
                <Input type="number" placeholder="15000" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned Class (Incharge)</Label>
                <Select value={form.assignedClass || "__none__"} onValueChange={v => setForm(f => ({ ...f, assignedClass: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">Not Assigned</SelectItem>
                    {classesList.map(c => {
                      const taken = teachers.some(t => t.isActive && t.assignedClass === c && t.id !== editing?.id);
                      return <SelectItem key={c} value={c} disabled={taken}>{c}{taken ? " (taken)" : ""}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Grayed-out classes already have an incharge teacher.</p>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Classes & Subjects Taught</Label>
                <div className="space-y-2">
                  {assignmentRows.map((row, index) => {
                    const subjectOptions = subjectOptionsFor(row.class);
                    return (
                      <div key={`${index}-${row.class}-${row.subject}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <Select
                          value={row.class || "__none__"}
                          onValueChange={(value) => setAssignmentRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { class: value === "__none__" ? "" : value, subject: "" } : item))}
                        >
                          <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectItem value="__none__">Class</SelectItem>
                            {classesList.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select
                          value={row.subject || "__none__"}
                          onValueChange={(value) => setAssignmentRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, subject: value === "__none__" ? "" : value } : item))}
                          disabled={!row.class}
                        >
                          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectItem value="__none__">Subject</SelectItem>
                            {subjectOptions.map((item) => <SelectItem key={item.id} value={item.subject}>{item.subject}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setAssignmentRows((rows) => rows.length === 1 ? [{ class: "", subject: "" }] : rows.filter((_, itemIndex) => itemIndex !== index))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setAssignmentRows((rows) => [...rows, { class: "", subject: "" }])}
                >
                  <Plus className="w-4 h-4" /> Add Class Subject
                </Button>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Timetable Notes</Label>
                <Input placeholder="Mon 9:00 Class 9 Bio; Tue 10:00 Class 10 CS" value={form.timetableNotes} onChange={e => setForm(f => ({ ...f, timetableNotes: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher Login Username</Label>
                <Input placeholder="teacher.ayesha" value={form.portalUsername} onChange={e => setForm(f => ({ ...f, portalUsername: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher Login Password</Label>
                <Input placeholder="Give this to teacher" value={form.portalPassword} onChange={e => setForm(f => ({ ...f, portalPassword: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Address (Optional)</Label>
                <Input placeholder="Home address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditing(null); setForm(EMPTY); }}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Enroll Teacher"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Teacher Record?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to permanently remove <strong>{deleteTarget?.name}</strong>? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Removing..." : "Remove Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeacherCard({ teacher, teachers, admin, onEdit, onToggle, onDelete }: {
  teacher: Teacher; teachers: Teacher[]; admin: boolean;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const subjects = teacher.subjectsTaught ? teacher.subjectsTaught.split(",").map(s => s.trim()).filter(Boolean) : [];
  const assignments = parseAssignments(teacher.teachingAssignments).filter((row) => row.class && row.subject);
  return (
    <Card className={`transition-all ${!teacher.isActive ? "opacity-60 bg-muted/20" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${teacher.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{teacher.name}</p>
              {teacher.assignedClass && (
                <Badge variant="outline" className="text-xs mt-0.5 bg-blue-50 border-blue-200 text-blue-700">
                  Incharge: {teacher.assignedClass}
                </Badge>
              )}
            </div>
          </div>
          {!teacher.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span className="font-mono">{teacher.mobileNumber || teacher.phone}</span></div>
          {teacher.qualification && <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 shrink-0" /><span>{teacher.qualification}</span></div>}
          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Joined: {format(new Date(teacher.joiningDate), "dd MMM yyyy")}</span></div>
          <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 shrink-0" /><span>Rs. {teacher.monthlySalary.toLocaleString()} / month</span></div>
          {teacher.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{teacher.address}</span></div>}
        </div>

        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 items-center">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {subjects.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
          </div>
        )}

        {assignments.length > 0 && (
          <div className="mt-3 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Assignments:</span>{" "}
            {assignments.map((row) => `${row.class} - ${row.subject}`).join("; ")}
          </div>
        )}

        {teacher.timetableNotes && (
          <div className="mt-2 rounded-md border bg-blue-50 p-2 text-xs text-blue-800">
            <span className="font-medium">Timetable:</span> {teacher.timetableNotes}
          </div>
        )}

        {admin && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5 flex-1"><Pencil className="w-3.5 h-3.5" /> Edit</Button>
            <Button size="sm" variant="outline" onClick={onToggle} className={`gap-1.5 flex-1 ${teacher.isActive ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}>
              {teacher.isActive ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive border-destructive/30 hover:bg-destructive/5">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
