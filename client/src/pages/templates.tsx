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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionTemplate, setVersionTemplate] = useState<SignatureTemplate | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);

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

  const handleShowVersions = async (template: SignatureTemplate) => {
    setVersionTemplate(template);
    setVersionModalOpen(true);
    setSelectedVersion(null);
    setRollbackLoading(false);
    // Fetch versions
    try {
      const res = await apiRequest("GET", `/api/templates/${template.id}/versions`);
      const json = res && typeof res.json === 'function' ? await res.json() : res;
      setVersions(json?.data ?? json ?? []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to load version history", variant: "destructive" });
      setVersions([]);
    }
  };

  const handleRollback = async (version: any) => {
    if (!versionTemplate) return;
    if (!confirm(`Rollback to version ${version.version}? This will overwrite the current template.`)) return;
    setRollbackLoading(true);
    try {
      await apiRequest("POST", `/api/templates/${versionTemplate.id}/rollback`, { version: version.version });
      toast({ title: "Rolled back", description: `Template rolled back to version ${version.version}` });
      setVersionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    } catch (e) {
      toast({ title: "Error", description: "Failed to rollback", variant: "destructive" });
    } finally {
      setRollbackLoading(false);
    }
  };

  const handleDuplicateTemplate = async (template: SignatureTemplate) => {
    const name = prompt("Enter a name for the duplicate template:", `${template.name} (Copy)`);
    if (!name) return;
    try {
      await apiRequest("POST", `/api/templates/${template.id}/duplicate`, { name });
      toast({ title: "Template duplicated", description: "A copy has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    } catch (e) {
      toast({ title: "Error", description: "Failed to duplicate template", variant: "destructive" });
    }
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
              {filteredTemplates.map((template, idx) => (
                <Card key={template.id} className="relative group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileSignature className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-500">Updated {formatDistanceToNow(new Date(template.updatedAt))} ago</div>
                        </div>
                      </div>
                      <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>{template.status}</Badge>
                    </div>
                    {/* HTML Preview */}
                    <div className="border rounded bg-white p-2 mb-4 min-h-[60px] max-h-32 overflow-auto" dangerouslySetInnerHTML={{ __html: template.htmlContent || '' }} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedTemplate(template); setIsPreviewOpen(true); }}>Preview</Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicateTemplate(template)}><Copy className="h-4 w-4 mr-1" />Duplicate</Button>
                      <Button size="sm" variant="outline" onClick={() => handleShowVersions(template)}><Eye className="h-4 w-4 mr-1" />Version History</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteTemplate(template)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Version History Modal */}
          <Dialog open={versionModalOpen} onOpenChange={setVersionModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Version History - {versionTemplate?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {versions.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No version history found.</div>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold">Version {v.version}</div>
                        <div className="text-xs text-gray-500 mb-2">Created: {new Date(v.created_at).toLocaleString()} by {v.creator?.first_name} {v.creator?.last_name}</div>
                        <div className="border rounded bg-gray-50 p-2 min-h-[40px] max-h-24 overflow-auto" dangerouslySetInnerHTML={{ __html: v.html_content || '' }} />
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button size="sm" variant="outline" onClick={() => setSelectedVersion(v)}>Preview</Button>
                        <Button size="sm" variant="destructive" disabled={rollbackLoading} onClick={() => handleRollback(v)}>
                          {rollbackLoading ? 'Rolling back...' : 'Rollback'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Version Preview Modal */}
              <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Preview - Version {selectedVersion?.version}</DialogTitle>
                  </DialogHeader>
                  <div className="border rounded bg-white p-4 min-h-[60px] max-h-96 overflow-auto" dangerouslySetInnerHTML={{ __html: selectedVersion?.html_content || '' }} />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedVersion(null)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DialogContent>
          </Dialog>
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
