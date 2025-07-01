import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  MoreHorizontal,
  Shield,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Edit
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTenant } from "@/hooks/use-tenant";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const inviteUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  role: z.enum(["admin", "member"]),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export default function Team() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManageUsers } = useTenant();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["/api/team"],
  });

  const inviteForm = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      role: "member",
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserFormData) => {
      return await apiRequest("POST", "/api/team/invite", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: "Invitation sent",
        description: "The team member has been invited successfully.",
      });
      setIsInviteDialogOpen(false);
      inviteForm.reset();
      setInviteError("");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to invite user";
      setInviteError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleInviteUser = (data: InviteUserFormData) => {
    setInviteError("");
    inviteUserMutation.mutate(data);
  };

  const filteredMembers = (teamMembers || []).filter((member: any) => {
    const searchString = `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getRoleIcon = (role: string) => {
    return role === "admin" ? (
      <ShieldCheck className="h-4 w-4 text-blue-600" />
    ) : (
      <Shield className="h-4 w-4 text-gray-400" />
    );
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === "admin" ? "default" : "secondary"}>
        {role === "admin" ? "Admin" : "Member"}
      </Badge>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Team Members" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Team Management</h2>
                  <p className="text-sm text-gray-600">
                    Manage your team members and their access levels
                  </p>
                </div>
                {canManageUsers && (
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to a new team member to join your organization.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={inviteForm.handleSubmit(handleInviteUser)} className="space-y-4">
                        {inviteError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{inviteError}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              {...inviteForm.register("firstName")}
                              placeholder="John"
                            />
                            {inviteForm.formState.errors.firstName && (
                              <p className="text-sm text-red-600">{inviteForm.formState.errors.firstName.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              {...inviteForm.register("lastName")}
                              placeholder="Doe"
                            />
                            {inviteForm.formState.errors.lastName && (
                              <p className="text-sm text-red-600">{inviteForm.formState.errors.lastName.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...inviteForm.register("email")}
                            placeholder="john@company.com"
                          />
                          {inviteForm.formState.errors.email && (
                            <p className="text-sm text-red-600">{inviteForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            {...inviteForm.register("username")}
                            placeholder="johndoe"
                          />
                          {inviteForm.formState.errors.username && (
                            <p className="text-sm text-red-600">{inviteForm.formState.errors.username.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={inviteForm.watch("role")}
                            onValueChange={(value) => inviteForm.setValue("role", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsInviteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={inviteUserMutation.isPending}>
                            {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search team members..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Team Members
                  {teamMembers && (
                    <Badge variant="secondary" className="ml-2">
                      {teamMembers.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    {searchTerm ? (
                      <>
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your search criteria.
                        </p>
                      </>
                    ) : (
                      <>
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No team members yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by inviting your first team member.
                        </p>
                        {canManageUsers && (
                          <div className="mt-6">
                            <Button onClick={() => setIsInviteDialogOpen(true)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Invite Member
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} alt={`${member.firstName} ${member.lastName}`} />
                                <AvatarFallback>
                                  {member.firstName[0]}{member.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {member.firstName} {member.lastName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Mail className="mr-1 h-3 w-3" />
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(member.role)}
                              {getRoleBadge(member.role)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.isActive ? "default" : "secondary"}>
                              {member.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {canManageUsers && (
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
