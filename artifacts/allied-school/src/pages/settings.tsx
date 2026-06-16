import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListCredentials,
  useChangePassword,
  getListCredentialsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isAdmin, getAuthUsername } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, KeyRound, User, Clock, Download, Upload, Database, AlertTriangle, Trash2 } from "lucide-react";

const adminChangeSchema = z.object({
  username: z.string().min(1, "Please select an account"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const ownChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function AdminSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getAuthUsername();
  const credentials = useListCredentials();
  const changePassword = useChangePassword();

  const form = useForm<z.infer<typeof adminChangeSchema>>({
    resolver: zodResolver(adminChangeSchema),
    defaultValues: { username: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof adminChangeSchema>) => {
    changePassword.mutate(
      { data: { username: data.username, newPassword: data.newPassword, adminUsername: currentUser ?? undefined } },
      {
        onSuccess: (res) => {
          if (res.success) {
            form.reset();
            queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
            toast({ title: "Password Updated", description: `Password for "${data.username}" has been changed.` });
          }
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to change password";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-PK", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            All Login Accounts
          </CardTitle>
          <CardDescription>All accounts that can access the management portal</CardDescription>
        </CardHeader>
        <CardContent>
          {credentials.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />)}
            </div>
          ) : credentials.data && credentials.data.length > 0 ? (
            <div className="space-y-3">
              {credentials.data.map((cred, idx) => (
                <div key={cred.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground capitalize">{cred.username}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Last updated: {formatDate(cred.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={cred.role === "director" ? "default" : "secondary"} className="capitalize text-xs">
                      {cred.role}
                    </Badge>
                  </div>
                  {idx < credentials.data!.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No accounts found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            Change Any Account's Password
          </CardTitle>
          <CardDescription>As admin, you can reset any account's password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account to update" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {credentials.data?.map((c) => (
                          <SelectItem key={c.username} value={c.username}>
                            {c.username} ({c.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min. 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Re-enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

function OwnPasswordSection() {
  const { toast } = useToast();
  const currentUser = getAuthUsername();
  const changePassword = useChangePassword();

  const form = useForm<z.infer<typeof ownChangeSchema>>({
    resolver: zodResolver(ownChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof ownChangeSchema>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "Session not found. Please log in again.", variant: "destructive" });
      return;
    }
    changePassword.mutate(
      {
        data: {
          username: currentUser,
          newPassword: data.newPassword,
          currentPassword: data.currentPassword,
          adminUsername: currentUser,
        }
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            form.reset();
            toast({ title: "Password Updated", description: "Your password has been changed successfully." });
          }
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to change password";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          Change My Password
        </CardTitle>
        <CardDescription>Your current password is required to set a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Account: </span>
              <span className="text-sm font-medium capitalize">{currentUser ?? "—"}</span>
            </div>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your current password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 6 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Re-enter new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BackupRestoreSection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/api/backup";
    link.download = `allied-school-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    toast({ title: "Backup Downloaded", description: "All school data saved as a JSON file." });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast({ title: "Invalid File", description: "Please select a .json backup file.", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    setConfirmRestore(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRestore = async () => {
    if (!pendingFile) return;
    setRestoring(true);
    setConfirmRestore(false);
    try {
      const text = await pendingFile.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json() as { success?: boolean; error?: string; message?: string };
      if (res.ok && result.success) {
        toast({ title: "Restore Complete", description: result.message ?? "All data has been restored successfully." });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({ title: "Restore Failed", description: result.error ?? "Could not restore data.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Restore Failed", description: "Invalid backup file or network error.", variant: "destructive" });
    } finally {
      setRestoring(false);
      setPendingFile(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Backup &amp; Restore
        </CardTitle>
        <CardDescription>
          Download all school data in one file, or restore from a previous backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div>
            <p className="text-sm font-medium">Download Full Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All students, fees &amp; attendance in one JSON file
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        <Separator />

        {/* Restore */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div>
            <p className="text-sm font-medium">Restore from Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a .json backup file to restore all data
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            {restoring ? "Restoring..." : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Confirm dialog */}
        {confirmRestore && pendingFile && (
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Warning: This will replace all current data</p>
                <p className="text-xs text-orange-700 mt-1">
                  File: <strong>{pendingFile.name}</strong><br />
                  Restoring will delete all existing students, fees, and attendance records and replace them with the backup data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRestore} className="bg-orange-600 hover:bg-orange-700 text-white">
                Yes, Restore Now
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setConfirmRestore(false); setPendingFile(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FactoryResetSection() {
  const { toast } = useToast();
  const [step, setStep] = useState<"idle" | "warn" | "confirm">("idle");
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (typed !== "RESET") return;
    setLoading(true);
    try {
      const res = await fetch("/api/factory-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: "RESET" }),
      });
      const result = await res.json() as { success?: boolean; error?: string; message?: string };
      if (res.ok && result.success) {
        toast({ title: "Reset Complete", description: "All school data cleared. Passwords unchanged." });
        setStep("idle");
        setTyped("");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      } else {
        toast({ title: "Reset Failed", description: result.error ?? "Could not reset data.", variant: "destructive" });
        setStep("idle");
      }
    } catch {
      toast({ title: "Network Error", description: "Could not connect to server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-red-700">
          <Trash2 className="w-4 h-4" />
          Factory Reset
        </CardTitle>
        <CardDescription>
          Wipe all school data and start fresh — passwords are NOT deleted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {step === "idle" && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/50">
            <div>
              <p className="text-sm font-medium text-red-800">Reset All School Data</p>
              <p className="text-xs text-red-600 mt-0.5">
                Deletes all students, fees, attendance &amp; announcements
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50 shrink-0"
              onClick={() => setStep("warn")}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        )}

        {step === "warn" && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Warning: This will delete ALL school data</p>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  The following will be permanently deleted:<br />
                  • All student records<br />
                  • All fee records<br />
                  • All attendance records<br />
                  • All announcements<br /><br />
                  Login passwords will NOT be changed.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setStep("confirm")}>
                I understand, continue
              </Button>
              <Button size="sm" variant="outline" onClick={() => setStep("idle")}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-800">
                Type <span className="font-mono bg-red-100 px-1 rounded">RESET</span> below to confirm permanent deletion
              </p>
            </div>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type RESET here"
              className="w-full border border-red-300 rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-red-700 hover:bg-red-800 text-white"
                disabled={typed !== "RESET" || loading}
                onClick={handleReset}
              >
                {loading ? "Resetting..." : "Confirm Factory Reset"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setStep("idle"); setTyped(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const adminMode = isAdmin();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {adminMode ? "Manage all accounts and school data" : "Manage your account"}
        </p>
      </div>

      {adminMode && <AdminSection />}

      <OwnPasswordSection />

      {adminMode && <BackupRestoreSection />}

      {adminMode && <FactoryResetSection />}

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Security Reminder</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Use a strong password with at least 8 characters. Never share your login credentials. Store backup files in a safe location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
