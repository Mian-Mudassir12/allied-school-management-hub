import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  getListAnnouncementsQueryKey,
  AnnouncementTargetRole,
  AnnouncementInputTargetRole
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, Trash2, Megaphone } from "lucide-react";

const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(5, "Content is required"),
  targetRole: z.enum([AnnouncementInputTargetRole.all, AnnouncementInputTargetRole.admin, AnnouncementInputTargetRole.parents])
});

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<AnnouncementTargetRole | 'all_roles'>('all_roles');

  const { data: announcements, isLoading } = useListAnnouncements(
    filterRole !== 'all_roles' ? { targetRole: filterRole } : {},
    { query: { queryKey: getListAnnouncementsQueryKey(filterRole !== 'all_roles' ? { targetRole: filterRole } : {}) } }
  );

  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "", targetRole: AnnouncementInputTargetRole.all },
  });

  const onSubmit = (data: z.infer<typeof announcementSchema>) => {
    createAnnouncement.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
          toast({ title: "Success", description: "Announcement created successfully." });
          setIsOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create announcement.", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncement.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
            toast({ title: "Deleted", description: "Announcement removed." });
          }
        }
      );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to staff and parents.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Megaphone className="w-4 h-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Title</Label>
                      <FormControl>
                        <Input placeholder="E.g., Tomorrow is a public holiday" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Target Audience</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AnnouncementInputTargetRole.all}>Everyone (Admin & Parents)</SelectItem>
                          <SelectItem value={AnnouncementInputTargetRole.parents}>Parents Only</SelectItem>
                          <SelectItem value={AnnouncementInputTargetRole.admin}>Staff/Admin Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Message Content</Label>
                      <FormControl>
                        <Textarea 
                          placeholder="Write the details of the announcement here..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createAnnouncement.isPending}>
                    {createAnnouncement.isPending ? "Posting..." : "Post Announcement"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <span className="text-sm font-medium text-muted-foreground">Filter by audience:</span>
        <Select value={filterRole} onValueChange={(val: any) => setFilterRole(val)}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_roles">All Announcements</SelectItem>
            <SelectItem value={AnnouncementTargetRole.parents}>Parents Only</SelectItem>
            <SelectItem value={AnnouncementTargetRole.admin}>Staff Only</SelectItem>
            <SelectItem value={AnnouncementTargetRole.all}>Everyone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Loading announcements...</div>
      ) : announcements && announcements.length > 0 ? (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    {announcement.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{format(new Date(announcement.createdAt), 'PPpp')}</span>
                    <span className="bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                      To: <span className="capitalize font-medium">{announcement.targetRole}</span>
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(announcement.id)}
                  disabled={deleteAnnouncement.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-4 text-sm leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            <Megaphone className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Announcements</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              There are no announcements matching your current filter. Create one to keep everyone informed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
