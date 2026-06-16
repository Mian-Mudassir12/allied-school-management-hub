import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { setAuthRole, setAuthUsername } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import schoolLogo from "@assets/image_1781358894878.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const resetSchema = z.object({
  targetUsername: z.string().min(1, "Please select an account"),
  adminPassword: z.string().min(1, "Admin password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm the new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { targetUsername: "", adminPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: z.infer<typeof resetSchema>) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.targetUsername,
          newPassword: data.newPassword,
          adminUsername: "admin",
          adminPassword: data.adminPassword,
        }),
      });
      const result = await res.json() as { success?: boolean; error?: string; message?: string };
      if (res.ok && result.success) {
        setSuccess(`Password for "${data.targetUsername}" has been reset successfully. You can now log in.`);
        form.reset();
      } else {
        setError(result.error ?? "Failed to reset password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            Reset Password
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Enter the admin password to reset any account's password.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetUsername"
              render={({ field }) => (
                <FormItem>
                  <Label>Account to Reset</Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">admin (Admin)</SelectItem>
                      <SelectItem value="director">director (Director)</SelectItem>
                      <SelectItem value="principal">principal (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <Label>Admin Password</Label>
                  <FormControl>
                    <Input type="password" placeholder="Enter admin account password" {...field} />
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
                  <Label>New Password</Label>
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
                  <Label>Confirm New Password</Label>
                  <FormControl>
                    <Input type="password" placeholder="Re-enter new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-700 font-medium bg-green-50 border border-green-200 p-3 rounded-md">
                {success}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const login = useLogin();
  const [errorMsg, setErrorMsg] = useState("");
  const [showReset, setShowReset] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    setErrorMsg("");
    login.mutate(
      { data },
      {
        onSuccess: (res) => {
          if (res.success) {
            setAuthRole(res.role as 'admin' | 'director' | 'teacher');
            setAuthUsername(res.username);
            setLocation("/dashboard");
          } else {
            setErrorMsg("Invalid credentials");
          }
        },
        onError: (err: unknown) => {
          const status = (err as { status?: number })?.status;
          if (status === 401) {
            setErrorMsg("Invalid username or password.");
          } else {
            setErrorMsg("Could not reach the server. Please try again.");
          }
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* School logo */}
        <div className="bg-white p-3 rounded-full shadow-md mb-5 ring-4 ring-primary/20">
          <img src={schoolLogo} alt="Allied School" className="w-20 h-20 object-contain" />
        </div>

        {/* School name header — solid dark card for maximum visibility */}
        <div className="w-full bg-primary rounded-2xl shadow-lg px-6 py-5 mb-6 text-center">
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
            Allied School
          </h1>
          <p className="text-white/80 font-medium mt-1 text-base tracking-wide">
            Rehman Campus Management
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-serif">Staff Login</CardTitle>
            <CardDescription>Enter your admin or director credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Username</Label>
                      <FormControl>
                        <Input placeholder="admin" {...field} className="h-11" autoComplete="username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Password</Label>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11" autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base shadow-md"
                  disabled={login.isPending}
                >
                  {login.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm"
                onClick={() => setShowReset(true)}
              >
                Forgot Password? Reset it
              </Button>
              <span className="text-muted-foreground">·</span>
              <Button variant="link" className="p-0 h-auto font-semibold text-primary text-sm" onClick={() => setLocation('/parents')}>
                Parent Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordModal open={showReset} onClose={() => setShowReset(false)} />
    </div>
  );
}
