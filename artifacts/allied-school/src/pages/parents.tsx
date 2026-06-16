import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useGetChildProgress, getGetChildProgressQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { User, Calendar, CreditCard, Bell, ShieldCheck, ChevronLeft, Search, Hash, Trophy, Printer } from "lucide-react";
import schoolLogo from "@assets/image_1781358894878.png";
import { CLASSES_LIST } from "@/lib/auth";

type SearchResult = {
  name: string;
  rollNumber: string;
  class: string;
  section: string | null;
  fatherName: string;
};

async function searchStudents(name: string, studentClass: string): Promise<SearchResult[]> {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (studentClass) params.set("class", studentClass);
  const res = await fetch(`/api/parents/search-students?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export default function ParentsPortalPage() {
  const [_, setLocation] = useLocation();

  // Search mode
  const [searchMode, setSearchMode] = useState<"roll" | "name">("roll");

  // Roll number search
  const [rollInput, setRollInput] = useState("");
  const [activeRollNumber, setActiveRollNumber] = useState<string | null>(null);

  // Name/class search
  const [nameInput, setNameInput] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: progress, isLoading, error } = useGetChildProgress(
    activeRollNumber || "",
    { query: { enabled: !!activeRollNumber, queryKey: getGetChildProgressQueryKey(activeRollNumber || "") } }
  );

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["parents-search", nameInput, classFilter],
    queryFn: () => searchStudents(nameInput, classFilter === "all" ? "" : classFilter),
    enabled: searchTriggered && (nameInput.length >= 2 || classFilter !== "all"),
  });

  const handleRollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (rollInput.trim()) setActiveRollNumber(rollInput.trim());
  };

  const handleNameSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTriggered(true);
  };

  const handleReset = () => {
    setActiveRollNumber(null);
    setRollInput("");
    setNameInput("");
    setClassFilter("all");
    setSearchTriggered(false);
  };

  // Progress view — shown after roll number is resolved
  if (activeRollNumber) {
    const progressWithResults = progress as typeof progress & {
      examResults?: Array<{
        id: number;
        subject: string;
        totalMarks: number;
        obtainedMarks: number;
        percentage: number;
        grade: string;
        status: string;
        position: number | null;
        paperTitle: string | null;
        paperUrl: string | null;
      }>;
    };
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground sticky top-0 z-10 shadow-md">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={schoolLogo} alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
              <span className="font-serif font-bold text-lg hidden sm:inline-block">Rehman Campus</span>
              <span className="font-serif font-bold text-lg sm:hidden">Parent Portal</span>
            </div>
            <Button variant="ghost" onClick={handleReset} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse">Loading student record...</div>
          ) : error || !progress ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-8 text-center">
                <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Student Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find a student with roll number "{activeRollNumber}". Please check and try again.
                </p>
                <Button onClick={handleReset} variant="outline">Try Again</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-gradient-to-r from-primary/5 to-transparent border-none shadow-sm">
                <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">{progress.student.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-mono"><ShieldCheck className="w-4 h-4" /> {progress.student.rollNumber}</span>
                      <span className="flex items-center gap-1.5"><UsersIcon className="w-4 h-4" /> {progress.student.class}{progress.student.section && ` (${progress.student.section})`}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-accent" /> Fee Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border bg-muted/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Current Month</span>
                          {progress.feeStatus.currentMonth?.paid ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Unpaid</span>
                          )}
                        </div>
                        <div className="font-mono text-xl font-semibold">Rs. {progress.student.monthlyFee.toLocaleString()}</div>
                      </div>
                      {progress.feeStatus.pendingCount > 0 && (
                        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-900">
                          <p className="text-sm font-medium mb-1">Outstanding Dues ({progress.feeStatus.pendingCount} months)</p>
                          <p className="font-mono text-lg font-bold">Rs. {progress.feeStatus.totalDue.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" /> Attendance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Term</p>
                        <div className="text-3xl font-bold font-mono">{progress.attendanceSummary.percentage}%</div>
                      </div>
                      <div className="text-right text-sm">
                        <p><span className="font-medium text-green-600">{progress.attendanceSummary.presentDays}</span> Present</p>
                        <p><span className="font-medium text-red-600">{progress.attendanceSummary.absentDays}</span> Absent</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recent Days</p>
                      <div className="flex gap-2 flex-wrap">
                        {progress.recentAttendance.length > 0 ? (
                          progress.recentAttendance.slice(0, 5).map(record => (
                            <div key={record.id} className={`flex flex-col items-center justify-center w-12 h-14 rounded border text-xs ${record.present ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                              <span className="font-medium">{format(new Date(record.date), "dd")}</span>
                              <span className="text-[10px] uppercase opacity-80">{format(new Date(record.date), "EEE")}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No recent attendance data.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {progress.announcements.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-accent" /> School Announcements
                  </h3>
                  <div className="grid gap-4">
                    {progress.announcements.map(ann => (
                      <Card key={ann.id} className="shadow-sm border-l-4 border-l-accent">
                        <CardHeader className="py-3 px-4 bg-muted/20 border-b">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{ann.title}</CardTitle>
                            <span className="text-xs text-muted-foreground">{format(new Date(ann.createdAt), "MMM dd")}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 text-sm whitespace-pre-wrap">{ann.content}</CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {progressWithResults?.examResults && progressWithResults.examResults.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" /> Exam Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {progressWithResults.examResults.map((result) => (
                      <Card key={result.id} className="shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-bold text-lg">{result.subject}</div>
                              <div className="text-sm text-muted-foreground">{result.paperTitle ?? "Result Card"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{result.percentage}%</div>
                              <div className="text-sm text-muted-foreground">Grade {result.grade}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                            <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Marks</div><strong>{result.obtainedMarks}/{result.totalMarks}</strong></div>
                            <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Status</div><strong>{result.status}</strong></div>
                            <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Position</div><strong>{result.position ?? "-"}</strong></div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            {result.paperUrl && <Button size="sm" variant="outline" onClick={() => window.open(result.paperUrl ?? "", "_blank")}>View Paper</Button>}
                            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print Card</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  // Search / Login screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-200 to-transparent -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img src={schoolLogo} alt="Allied School" className="w-24 h-24 object-contain mb-6 drop-shadow-md" />
        <h2 className="text-center text-3xl font-serif font-bold text-foreground">Parent Portal</h2>
        <p className="mt-2 text-center text-muted-foreground">Access your child's progress, attendance, and fee status.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardContent className="pt-6">
            {/* Mode tabs */}
            <div className="flex rounded-lg border overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => { setSearchMode("roll"); setSearchTriggered(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${searchMode === "roll" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
              >
                <Hash className="w-4 h-4" /> Roll Number
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode("name"); setActiveRollNumber(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${searchMode === "name" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
              >
                <Search className="w-4 h-4" /> Search by Name
              </button>
            </div>

            {searchMode === "roll" ? (
              <form onSubmit={handleRollSearch} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Student Roll Number</Label>
                  <Input
                    id="rollNumber"
                    placeholder="E.g. 4GD-2023-001"
                    value={rollInput}
                    onChange={e => setRollInput(e.target.value)}
                    className="h-12 text-lg text-center font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">Enter the exact roll number given by school administration.</p>
                </div>
                <Button type="submit" className="w-full h-12 text-base shadow-sm">View Student Progress</Button>
              </form>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleNameSearch} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Student / Father Name</Label>
                    <Input
                      placeholder="Type at least 2 characters..."
                      value={nameInput}
                      onChange={e => { setNameInput(e.target.value); setSearchTriggered(false); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Class (optional)</Label>
                    <Select value={classFilter} onValueChange={v => { setClassFilter(v); setSearchTriggered(false); }}>
                      <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {CLASSES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={nameInput.length < 2 && classFilter === "all"}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </form>

                {searchTriggered && (
                  <div className="space-y-2">
                    {isSearching ? (
                      <p className="text-center text-sm text-muted-foreground animate-pulse py-4">Searching...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">No students found. Try different search terms.</p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">{searchResults.length} result(s) found. Click your child's name to view progress.</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map(s => (
                            <button
                              key={s.rollNumber}
                              onClick={() => setActiveRollNumber(s.rollNumber)}
                              className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                              <div className="font-medium text-sm">{s.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {s.class}{s.section ? ` • ${s.section}` : ""} &bull; Roll: <span className="font-mono">{s.rollNumber}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Father: {s.fatherName}</div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <Button variant="link" className="text-muted-foreground" onClick={() => setLocation("/login")}>
                Staff Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
