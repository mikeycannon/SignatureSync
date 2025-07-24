import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileSignature, 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Trash2,
  Eye,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TemplatePreviewModal } from "@/components/template-preview-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type SignatureTemplate } from "@shared/schema";

export default function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<SignatureTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template deleted",
        description: "The template has been successfully deleted.",
      });
      setIsPreviewOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = Array.isArray(templates) ? templates.filter((template: SignatureTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || template.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const handleEditTemplate = (template: SignatureTemplate) => {
    window.location.href = `/templates/${template.id}/edit`;
  };

  const handleDuplicateTemplate = async (template: SignatureTemplate) => {
    // TODO: Implement duplicate functionality
    toast({
      title: "Feature coming soon",
      description: "Template duplication will be available soon.",
    });
  };

  const handleDeleteTemplate = async (template: SignatureTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
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
        <TopBar title="Signature Templates" onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* Header and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">All Templates</h2>
                <p className="text-sm text-gray-600">
                  Manage your signature templates and create new ones
                </p>
              </div>
              <Link href="/templates/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </Link>
            </div>

            {/* Search and Filters */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-16" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || statusFilter !== "all" ? "No templates found" : "No templates yet"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first signature template."
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <div className="mt-6">
                  <Link href="/templates/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: SignatureTemplate, index: number) => (
                <Card 
                  key={template.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsPreviewOpen(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 ${getTemplateGradient(index)} rounded-lg flex items-center justify-center`}>
                        <FileSignature className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                        {template.status}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                    </p>

                    <div className="flex items-center justify-between">
                      {template.isShared && (
                        <Badge variant="outline" className="text-xs">
                          Shared
                        </Badge>
                      )}
                      <div className="flex space-x-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
