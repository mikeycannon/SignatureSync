import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileSignature, 
  Users, 
  CheckCircle, 
  Database,
  Plus,
  UserPlus,
  Upload,
  BarChart3,
  Edit,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TemplatePreviewModal } from "@/components/template-preview-modal";
import { type SignatureTemplate } from "@shared/schema";

export default function Dashboard() {
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates"],
  });

  const recentTemplates = templates?.slice(0, 3) || [];

  const handleEditTemplate = (template: SignatureTemplate) => {
    // Navigate to template editor
    window.location.href = `/templates/${template.id}/edit`;
  };

  const handleDuplicateTemplate = (template: SignatureTemplate) => {
    console.log("Duplicate template:", template);
    // TODO: Implement duplicate functionality
  };

  const handleDeleteTemplate = (template: SignatureTemplate) => {
    console.log("Delete template:", template);
    // TODO: Implement delete functionality
  };

  const getTemplateGradient = (index: number) => {
    const gradients = [
      "gradient-blue",
      "gradient-green", 
      "gradient-orange",
      "gradient-purple"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Templates</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeTemplates || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileSignature className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-green-600 font-medium">+12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.teamMembers || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-green-600 font-medium">+8 new this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Signatures Used</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.signaturesUsed || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-green-600 font-medium">+24% usage increase</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Storage Used</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.storageUsed || 0} MB</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-500">of 1000 MB plan</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Templates */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Templates</CardTitle>
                    <Link href="/templates">
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : recentTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating your first signature template.</p>
                      <div className="mt-6">
                        <Link href="/templates/new">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Template
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentTemplates.map((template, index) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <div className="flex items-center">
                            <div className={`w-10 h-10 ${getTemplateGradient(index)} rounded-lg flex items-center justify-center mr-4`}>
                              <FileSignature className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                              <p className="text-xs text-gray-500">
                                Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                              {template.status}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Quick Actions and Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/templates/new">
                      <Button variant="ghost" className="w-full justify-between h-auto p-3">
                        <div className="flex items-center">
                          <Plus className="mr-3 h-5 w-5 text-primary-600" />
                          <span className="text-sm font-medium">Create Template</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Button>
                    </Link>

                    <Link href="/team">
                      <Button variant="ghost" className="w-full justify-between h-auto p-3">
                        <div className="flex items-center">
                          <UserPlus className="mr-3 h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Invite Team Member</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Button>
                    </Link>

                    <Link href="/assets">
                      <Button variant="ghost" className="w-full justify-between h-auto p-3">
                        <div className="flex items-center">
                          <Upload className="mr-3 h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Upload Assets</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Button>
                    </Link>

                    <Link href="/analytics">
                      <Button variant="ghost" className="w-full justify-between h-auto p-3">
                        <div className="flex items-center">
                          <BarChart3 className="mr-3 h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium">View Analytics</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !recentActivity || recentActivity.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={activity.user?.avatar} />
                            <AvatarFallback>
                              {activity.user?.firstName?.[0]}{activity.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">
                                {activity.user?.firstName} {activity.user?.lastName}
                              </span>{" "}
                              {activity.action} {activity.entityType}
                              {activity.metadata?.name && (
                                <span className="font-medium"> "{activity.metadata.name}"</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <TemplatePreviewModal
        template={selectedTemplate}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onEdit={handleEditTemplate}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}
