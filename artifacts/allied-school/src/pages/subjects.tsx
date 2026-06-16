import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type ClassSubject = {
  id: number;
  class: string;
  subject: string;
  bookName: string;
};

async function fetchClasses() {
  const res = await fetch("/api/students/classes");
  if (!res.ok) throw new Error("Failed to fetch classes");
  return res.json() as Promise<string[]>;
}

async function fetchSubjects(studentClass: string) {
  const res = await fetch(`/api/academic/subjects?class=${encodeURIComponent(studentClass)}`);
  if (!res.ok) throw new Error("Failed to fetch subjects");
  return res.json() as Promise<ClassSubject[]>;
}

export default function SubjectsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("");
  const [bookName, setBookName] = useState("");

  const { data: classesList = [] } = useQuery({ queryKey: ["students-classes"], queryFn: fetchClasses });
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["academic-subjects", selectedClass],
    queryFn: () => fetchSubjects(selectedClass),
    enabled: !!selectedClass,
  });

  useEffect(() => {
    if (classesList.length > 0 && !selectedClass) setSelectedClass(classesList[0]);
  }, [classesList, selectedClass]);

  const addSubject = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/academic/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: selectedClass, subject, bookName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add subject");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-subjects", selectedClass] });
      setSubject("");
      setBookName("");
      toast({ title: "Subject added", description: `${subject} saved for ${selectedClass}.` });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/academic/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subject");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-subjects", selectedClass] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Subjects per Class</h1>
        <p className="text-muted-foreground mt-1">Configure which subjects are taught in each class.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <Card>
          <CardHeader className="border-b">
            <div className="font-semibold">Select Class</div>
          </CardHeader>
          <CardContent className="p-0 max-h-[620px] overflow-y-auto">
            {classesList.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedClass(item)}
                className={`w-full text-left px-5 py-4 text-sm transition-colors ${selectedClass === item ? "bg-[#1e2f50] text-white font-semibold" : "hover:bg-muted"}`}
              >
                {item}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold text-lg">{selectedClass || "Class"} - Subjects</div>
                <div className="text-sm text-muted-foreground">{subjects.length} subjects configured</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground">Loading subjects...</div>
            ) : subjects.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No subjects added for this class yet.</div>
            ) : subjects.map((item) => (
              <div key={item.id} className="rounded-md border bg-muted/30 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{item.subject}</div>
                  {item.bookName && <div className="text-sm text-muted-foreground">{item.bookName}</div>}
                </div>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteSubject.mutate(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="pt-5 mt-5 border-t space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Add a new subject..." />
                <Input value={bookName} onChange={(event) => setBookName(event.target.value)} placeholder="Book name (optional)" />
                <Button className="gap-2" onClick={() => addSubject.mutate()} disabled={!selectedClass || !subject.trim() || addSubject.isPending}>
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              <Button className="w-full gap-2 bg-[#1e2f50] hover:bg-[#15233c]" onClick={() => toast({ title: "Subject configuration saved", description: `${selectedClass} subjects are ready for portal dropdowns.` })}>
                <Save className="w-4 h-4" /> Save Subject Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
