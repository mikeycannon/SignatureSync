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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    window.location.href = `/templates/${template.id}/edit`;
  };

  const handleDuplicateTemplate = (template: SignatureTemplate) => {
    console.log("Duplicate template:", template);
  };

  const handleDeleteTemplate = (template: SignatureTemplate) => {
    console.log("Delete template:", template);
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
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Dashboard" onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
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
                    <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                  </div>
                  <div className="gradient-blue rounded-lg p-3">
                    <FileSignature className="h-6 w-6 text-white" />
                  </div>
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
                    <p className="text-xs text-green-600 mt-1">+8 new this week</p>
                  </div>
                  <div className="gradient-green rounded-lg p-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
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
                    <p className="text-xs text-green-600 mt-1">+24% usage increase</p>
                  </div>
                  <div className="gradient-orange rounded-lg p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
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
                    <p className="text-xs text-gray-500 mt-1">of 1000 MB plan</p>
                  </div>
                  <div className="gradient-purple rounded-lg p-3">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Create Template */}
              <Link href="/templates/new">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 rounded-lg p-2">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Create Template</h3>
                      <p className="text-sm text-gray-500">Design a new signature</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Invite Team Member */}
              <Link href="/team">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 rounded-lg p-2">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Invite Team Member</h3>
                      <p className="text-sm text-gray-500">Add someone to workspace</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Upload Assets */}
              <Link href="/assets">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 rounded-lg p-2">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Upload Assets</h3>
                      <p className="text-sm text-gray-500">Add logos and images</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* View Analytics */}
              <Link href="/analytics">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-500 rounded-lg p-2">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">View Analytics</h3>
                      <p className="text-sm text-gray-500">Check usage statistics</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Templates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Recent Templates</CardTitle>
              <Link href="/templates">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTemplates.length > 0 ? (
                <div className="space-y-3">
                  {recentTemplates.map((template: any, index: number) => (
                    <div key={template.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group">
                      <div className={`w-12 h-12 ${getTemplateGradient(index)} rounded-lg flex items-center justify-center`}>
                        <FileSignature className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          Updated {formatDistanceToNow(new Date(template.updatedAt))} ago
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first signature template.</p>
                  <div className="mt-6">
                    <Link href="/templates/new">
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <TemplatePreviewModal
            template={selectedTemplate}
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            onEdit={handleEditTemplate}
            onDuplicate={handleDuplicateTemplate}
            onDelete={handleDeleteTemplate}
          />
        </main>
      </div>
    </div>
  );
}