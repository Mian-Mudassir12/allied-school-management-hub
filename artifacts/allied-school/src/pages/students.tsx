import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListStudents,
  useCreateStudent,
  useGetStudent,
  useUpdateStudent,
  getListStudentsQueryKey,
  getGetStudentQueryKey
} from "@workspace/api-client-react";
import { CLASSES_LIST, SENIOR_CLASSES, SUBJECT_GROUPS, isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, FileText, Edit, LogOut, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const phoneRegex = /^\+92\d{10}$/;
const phoneMessage = "Use +92 followed by exactly 10 digits, e.g. +923700572988";

const studentSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required"),
  name: z.string().min(2, "Name is required"),
  class: z.string().min(1, "Class is required"),
  section: z.string().optional(),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().optional(),
  fatherPhone: z.string().regex(phoneRegex, phoneMessage),
  homePhone: z.string().regex(phoneRegex, phoneMessage),
  whatsappNumber: z.string().optional(),
  hasWhatsapp: z.boolean().default(true),
  address: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  monthlyFee: z.coerce.number().min(0, "Fee must be positive"),
}).superRefine((data, ctx) => {
  if (data.hasWhatsapp && !phoneRegex.test(data.whatsappNumber ?? "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["whatsappNumber"], message: phoneMessage });
  }
});

const editStudentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  class: z.string().min(1, "Class is required"),
  section: z.string().optional(),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().optional(),
  fatherPhone: z.string().regex(phoneRegex, phoneMessage),
  homePhone: z.string().regex(phoneRegex, phoneMessage),
  whatsappNumber: z.string().optional(),
  hasWhatsapp: z.boolean().default(true),
  address: z.string().optional(),
  monthlyFee: z.coerce.number().min(0, "Fee must be positive"),
}).superRefine((data, ctx) => {
  if (data.hasWhatsapp && !phoneRegex.test(data.whatsappNumber ?? "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["whatsappNumber"], message: phoneMessage });
  }
});

type StudentListItem = {
  id: number;
  rollNumber: string;
  name: string;
  class: string;
  section?: string | null;
  fatherName: string;
  phone: string;
  fatherPhone?: string | null;
  homePhone?: string | null;
  whatsappNumber?: string | null;
  hasWhatsapp?: boolean;
  isActive: boolean;
  leftDate?: string | null;
  monthlyFee: number;
  address?: string | null;
  motherName?: string | null;
  admissionDate: string;
};

function StudentDetails({
  studentId,
  onClose,
  onMarkLeft,
  onEdit,
}: {
  studentId: number;
  onClose: () => void;
  onMarkLeft: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  const { data: student, isLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading details...</div>;
  if (!student) return <div className="p-8 text-center text-muted-foreground">Student not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-serif">{student.name}</h2>
          <div className="text-muted-foreground flex gap-3 text-sm mt-1">
            <span>Roll: {student.rollNumber}</span>
            <span>Class: {student.class} {student.section && `(${student.section})`}</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {student.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="fees">Fees History</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Father's Name</p>
              <p className="font-medium">{student.fatherName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mother's Name</p>
              <p className="font-medium">{student.motherName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Father Number</p>
              <p className="font-medium">{student.fatherPhone || student.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Home Number</p>
              <p className="font-medium">{student.homePhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">WhatsApp</p>
              <p className="font-medium">{student.hasWhatsapp ? (student.whatsappNumber || 'N/A') : 'No WhatsApp'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Admission Date</p>
              <p className="font-medium">{format(new Date(student.admissionDate), 'PP')}</p>
            </div>
            {(student as { leftDate?: string | null }).leftDate && (
              <div>
                <p className="text-muted-foreground">Left School On</p>
                <p className="font-medium text-red-600">{format(new Date((student as { leftDate: string }).leftDate), 'PP')}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{student.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Monthly Fee</p>
              <p className="font-medium font-mono text-primary">Rs. {student.monthlyFee.toLocaleString()}</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="fees" className="pt-4">
          {student.feeHistory && student.feeHistory.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {student.feeHistory.map(fee => (
                <div key={fee.id} className="flex justify-between items-center p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium">{format(new Date(fee.year, fee.month - 1), 'MMMM yyyy')}</p>
                    <p className="text-xs text-muted-foreground font-mono">Rs. {fee.amount.toLocaleString()}</p>
                  </div>
                  {fee.paid ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Paid {fee.paidDate && format(new Date(fee.paidDate), 'dd/MM/yy')}</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Unpaid</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No fee history available.</p>
          )}
        </TabsContent>
        <TabsContent value="attendance" className="pt-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-green-50 border border-green-100 text-center">
              <p className="text-sm text-green-800 font-medium mb-1">Present</p>
              <p className="text-3xl font-bold text-green-600">{student.attendanceSummary.presentDays}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-center">
              <p className="text-sm text-red-800 font-medium mb-1">Absent</p>
              <p className="text-3xl font-bold text-red-600">{student.attendanceSummary.absentDays}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <div
              className="w-36 h-36 rounded-full grid place-items-center transition-all duration-700"
              style={{ background: `conic-gradient(hsl(var(--primary)) ${student.attendanceSummary.percentage * 3.6}deg, hsl(var(--muted)) 0deg)` }}
            >
              <div className="w-28 h-28 rounded-full bg-card grid place-items-center shadow-inner">
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono text-primary">{student.attendanceSummary.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(studentId)}>
            <Edit className="w-3.5 h-3.5" /> Edit Student
          </Button>
          {student.isActive && (
            <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onMarkLeft(studentId)}>
              <LogOut className="w-3.5 h-3.5" /> Mark as Left
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [whatsappFilter, setWhatsappFilter] = useState<"all" | "with" | "without">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewStudentId, setViewStudentId] = useState<number | null>(null);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [markLeftStudentId, setMarkLeftStudentId] = useState<number | null>(null);
  const [leftDate, setLeftDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: students, isLoading } = useListStudents(
    { 
      search: search.length > 2 ? search : undefined, 
      class: selectedClass !== "All" ? selectedClass : undefined,
      whatsapp: whatsappFilter !== "all" ? whatsappFilter : undefined
    },
    { 
      query: { 
        queryKey: getListStudentsQueryKey({ 
          search: search.length > 2 ? search : undefined, 
          class: selectedClass !== "All" ? selectedClass : undefined,
          whatsapp: whatsappFilter !== "all" ? whatsappFilter : undefined
        }) 
      } 
    }
  );

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      rollNumber: "",
      name: "",
      class: CLASSES_LIST[0],
      section: "",
      fatherName: "",
      motherName: "",
      fatherPhone: "+92",
      homePhone: "+92",
      whatsappNumber: "+92",
      hasWhatsapp: true,
      address: "",
      admissionDate: format(new Date(), 'yyyy-MM-dd'),
      monthlyFee: 0
    },
  });

  const editForm = useForm<z.infer<typeof editStudentSchema>>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      name: "",
      class: CLASSES_LIST[0],
      section: "",
      fatherName: "",
      motherName: "",
      fatherPhone: "+92",
      homePhone: "+92",
      whatsappNumber: "+92",
      hasWhatsapp: true,
      address: "",
      monthlyFee: 0
    },
  });

  const editingStudent = editStudentId
    ? students?.find(s => s.id === editStudentId)
    : null;

  const handleOpenEdit = (id: number) => {
    const s = students?.find(st => st.id === id) as StudentListItem | undefined;
    if (s) {
      editForm.reset({
        name: s.name,
        class: s.class,
        section: s.section ?? "",
        fatherName: s.fatherName,
        motherName: s.motherName ?? "",
        fatherPhone: s.fatherPhone ?? s.phone,
        homePhone: s.homePhone ?? "+92",
        whatsappNumber: s.whatsappNumber ?? "+92",
        hasWhatsapp: s.hasWhatsapp ?? true,
        address: s.address ?? "",
        monthlyFee: s.monthlyFee,
      });
    }
    setViewStudentId(null);
    setEditStudentId(id);
  };

  const handleOpenMarkLeft = (id: number) => {
    setLeftDate(format(new Date(), 'yyyy-MM-dd'));
    setViewStudentId(null);
    setMarkLeftStudentId(id);
  };

  const onSubmitAdd = (data: z.infer<typeof studentSchema>) => {
    createStudent.mutate(
      { data: { ...data, phone: data.fatherPhone, whatsappNumber: data.hasWhatsapp ? data.whatsappNumber : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          toast({ title: "Success", description: "Student registered successfully." });
          setIsAddOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to register student.", variant: "destructive" });
        }
      }
    );
  };

  const onSubmitEdit = (data: z.infer<typeof editStudentSchema>) => {
    if (!editStudentId) return;
    updateStudent.mutate(
      { id: editStudentId, data: { ...data, phone: data.fatherPhone, whatsappNumber: data.hasWhatsapp ? data.whatsappNumber : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(editStudentId) });
          toast({ title: "Saved", description: "Student details updated." });
          setEditStudentId(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update student.", variant: "destructive" });
        }
      }
    );
  };

  const onConfirmLeft = () => {
    if (!markLeftStudentId) return;
    updateStudent.mutate(
      { id: markLeftStudentId, data: { isActive: false, leftDate } as Parameters<typeof updateStudent.mutate>[0]['data'] },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(markLeftStudentId) });
          toast({ title: "Done", description: "Student marked as left." });
          setMarkLeftStudentId(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update student.", variant: "destructive" });
        }
      }
    );
  };

  const studentFormFields = (control: Parameters<typeof form.control['register']>[0] extends string ? typeof form.control : typeof form.control) => null;
  void studentFormFields;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Students Directory</h1>
          <p className="text-muted-foreground mt-1">Manage enrollments, records, and student profiles.</p>
        </div>

        {isAdmin() && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm whitespace-nowrap">
                <UserPlus className="w-4 h-4" />
                New Admission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Student</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="rollNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl><Input placeholder="2024-001" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Student Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="class" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {CLASSES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="section" render={({ field }) => {
                      const selectedClass = form.watch("class");
                      const isSenior = SENIOR_CLASSES.includes(selectedClass);
                      return (
                        <FormItem>
                          <FormLabel>{isSenior ? "Subject Group" : "Section (Optional)"}</FormLabel>
                          {isSenior ? (
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {SUBJECT_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl><Input placeholder="A" {...field} /></FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }} />
                    <FormField control={form.control} name="fatherName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Name</FormLabel>
                        <FormControl><Input placeholder="Father's Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="motherName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Name (Optional)</FormLabel>
                        <FormControl><Input placeholder="Mother's Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fatherPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father Number</FormLabel>
                        <FormControl><Input placeholder="+923700572988" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="homePhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Number</FormLabel>
                        <FormControl><Input placeholder="+923001234567" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsappNumber" render={({ field }) => {
                      const hasWhatsapp = form.watch("hasWhatsapp");
                      return (
                        <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl><Input placeholder="+923001234567" disabled={!hasWhatsapp} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }} />
                    <FormField control={form.control} name="hasWhatsapp" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <FormControl>
                          <Checkbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 text-sm font-normal">Student does not have WhatsApp</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="admissionDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="monthlyFee" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Fee (Rs.)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Address</FormLabel>
                      <FormControl><Input placeholder="Complete address" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createStudent.isPending}>
                      {createStudent.isPending ? "Registering..." : "Complete Registration"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={!!editStudentId} onOpenChange={(open) => { if (!open) setEditStudentId(null); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit Student — {editingStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="class" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CLASSES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="section" render={({ field }) => {
                  const selectedClass = editForm.watch("class");
                  const isSenior = SENIOR_CLASSES.includes(selectedClass);
                  return (
                    <FormItem>
                      <FormLabel>{isSenior ? "Subject Group" : "Section"}</FormLabel>
                      {isSenior ? (
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {SUBJECT_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl><Input placeholder="A" {...field} /></FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }} />
                <FormField control={editForm.control} name="fatherName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="motherName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother's Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="fatherPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Number</FormLabel>
                    <FormControl><Input placeholder="+923700572988" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="homePhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Number</FormLabel>
                    <FormControl><Input placeholder="+923001234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="whatsappNumber" render={({ field }) => {
                  const hasWhatsapp = editForm.watch("hasWhatsapp");
                  return (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl><Input placeholder="+923001234567" disabled={!hasWhatsapp} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }} />
                <FormField control={editForm.control} name="hasWhatsapp" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <FormControl>
                      <Checkbox
                        checked={!field.value}
                        onCheckedChange={(checked) => field.onChange(!checked)}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 text-sm font-normal">Student does not have WhatsApp</FormLabel>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="monthlyFee" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Fee (Rs.)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Address</FormLabel>
                  <FormControl><Input placeholder="Complete address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditStudentId(null)}>Cancel</Button>
                <Button type="submit" disabled={updateStudent.isPending}>
                  {updateStudent.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Mark as Left Dialog */}
      <Dialog open={!!markLeftStudentId} onOpenChange={(open) => { if (!open) setMarkLeftStudentId(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" /> Mark Student as Left
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              This will mark <strong>{students?.find(s => s.id === markLeftStudentId)?.name}</strong> as inactive. Please enter the date they left the school.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date of Leaving</label>
              <Input
                type="date"
                value={leftDate}
                onChange={e => setLeftDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMarkLeftStudentId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={!leftDate || updateStudent.isPending}
                onClick={onConfirmLeft}
              >
                {updateStudent.isPending ? "Saving..." : "Confirm — Mark as Left"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {CLASSES_LIST.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-52">
              <Select value={whatsappFilter} onValueChange={(value) => setWhatsappFilter(value as "all" | "with" | "without")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="WhatsApp Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="with">With WhatsApp</SelectItem>
                  <SelectItem value="without">Without WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Loading students...</div>
          ) : students && students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Roll No</th>
                    <th className="px-6 py-4 font-medium">Student Name</th>
                    <th className="px-6 py-4 font-medium">Class</th>
                    <th className="px-6 py-4 font-medium">Parent Contact</th>
                    <th className="px-6 py-4 font-medium">WhatsApp</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{student.rollNumber}</td>
                      <td className="px-6 py-4 font-medium">{student.name}</td>
                      <td className="px-6 py-4">{student.class} {student.section && `(${student.section})`}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">{student.fatherName}</div>
                        <div className="text-xs text-muted-foreground">{student.fatherPhone || student.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {student.hasWhatsapp ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-800">With WhatsApp</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">No WhatsApp</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Dialog open={viewStudentId === student.id} onOpenChange={(open) => setViewStudentId(open ? student.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-8 px-2">
                                <FileText className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              {viewStudentId === student.id && (
                                <StudentDetails
                                  studentId={student.id}
                                  onClose={() => setViewStudentId(null)}
                                  onMarkLeft={handleOpenMarkLeft}
                                  onEdit={handleOpenEdit}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                          {/* Edit */}
                          {isAdmin() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground h-8 px-2"
                              onClick={() => handleOpenEdit(student.id)}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                          )}
                          {/* Mark as Left */}
                          {isAdmin() && student.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                              onClick={() => handleOpenMarkLeft(student.id)}
                            >
                              <LogOut className="w-3.5 h-3.5 mr-1" /> Left
                            </Button>
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
              <UserPlus className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No students found.</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search filters or register a new student.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
