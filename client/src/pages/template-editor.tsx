import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Globe, 
  Mail, 
  Phone,
  Save,
  ArrowLeft,
  Eye,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSignatureTemplateSchema, type SignatureTemplate } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema for form data (includes signature fields)
const templateFormSchema = z.object({
  // Template metadata
  name: z.string().min(1, "Template name is required"),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isShared: z.boolean().default(false),
  
  // Signature data fields
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedIn: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  logoUrl: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateEditorProps {
  templateId?: number;
}

export default function TemplateEditor({ templateId }: TemplateEditorProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("basic");
  const [previewMode, setPreviewMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery<SignatureTemplate>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId,
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      status: "draft",
      isShared: false,
      fullName: "",
      jobTitle: "",
      company: "",
      email: "",
      phone: "",
      website: "",
      linkedIn: "",
      twitter: "",
      instagram: "",
      logoUrl: "",
    },
  });

  // Populate form when template data is loaded
  useEffect(() => {
    if (template && templateId) {
      const content = (template as any)?.content || {};
      form.reset({
        name: (template as any)?.name || "",
        status: ((template as any)?.status as "draft" | "active" | "archived") || "draft",
        isShared: (template as any)?.isShared || false,
        fullName: content.fullName || "",
        jobTitle: content.jobTitle || "",
        company: content.company || "",
        email: content.email || "",
        phone: content.phone || "",
        website: content.website || "",
        linkedIn: content.linkedIn || "",
        twitter: content.twitter || "",
        instagram: content.instagram || "",
        logoUrl: content.logoUrl || "",
      });
    }
  }, [template, templateId, form]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { name, status, isShared, ...signatureData } = data;
      
      const templateData = {
        name,
        status,
        isShared,
        content: signatureData,
        htmlContent: generateHtmlContent(signatureData),
      };

      if (templateId) {
        return await apiRequest("PUT", `/api/templates/${templateId}`, templateData);
      } else {
        return await apiRequest("POST", "/api/templates", templateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: templateId ? "Template updated" : "Template created",
        description: `Your signature template has been ${templateId ? "updated" : "created"} successfully.`,
      });
      setLocation("/templates");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${templateId ? "update" : "create"} template`,
        variant: "destructive",
      });
    },
  });

  const generateHtmlContent = (data: Partial<TemplateFormData>): string => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; line-height: 1.4;">
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
          <tr>
            ${data.logoUrl ? `
              <td style="padding-right: 20px; vertical-align: top;">
                <img src="${data.logoUrl}" alt="Company Logo" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <div style="margin-bottom: 8px;">
                ${data.fullName ? `
                  <div style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 2px;">
                    ${data.fullName}
                  </div>
                ` : ''}
                ${data.jobTitle ? `
                  <div style="font-size: 14px; color: #666666; margin-bottom: 2px;">
                    ${data.jobTitle}
                  </div>
                ` : ''}
                ${data.company ? `
                  <div style="font-size: 14px; color: #666666;">
                    ${data.company}
                  </div>
                ` : ''}
              </div>
              
              <div style="margin-bottom: 12px;">
                ${data.email ? `
                  <div style="font-size: 13px; color: #888888; margin-bottom: 2px;">
                    📧 <a href="mailto:${data.email}" style="color: #888888; text-decoration: none;">${data.email}</a>
                  </div>
                ` : ''}
                ${data.phone ? `
                  <div style="font-size: 13px; color: #888888; margin-bottom: 2px;">
                    📞 <a href="tel:${data.phone}" style="color: #888888; text-decoration: none;">${data.phone}</a>
                  </div>
                ` : ''}
                ${data.website ? `
                  <div style="font-size: 13px; color: #888888;">
                    🌐 <a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: #888888; text-decoration: none;">${data.website}</a>
                  </div>
                ` : ''}
              </div>
              
              ${(data.linkedIn || data.twitter || data.instagram) ? `
                <div style="margin-top: 12px;">
                  ${data.linkedIn ? `
                    <a href="${data.linkedIn}" style="text-decoration: none; margin-right: 12px; color: #0077B5;">
                      <span style="font-size: 12px;">LinkedIn</span>
                    </a>
                  ` : ''}
                  ${data.twitter ? `
                    <a href="${data.twitter}" style="text-decoration: none; margin-right: 12px; color: #1DA1F2;">
                      <span style="font-size: 12px;">Twitter</span>
                    </a>
                  ` : ''}
                  ${data.instagram ? `
                    <a href="${data.instagram}" style="text-decoration: none; color: #E4405F;">
                      <span style="font-size: 12px;">Instagram</span>
                    </a>
                  ` : ''}
                </div>
              ` : ''}
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  const handleSave = (data: TemplateFormData) => {
    saveTemplateMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/templates");
  };

  if (isLoading && templateId) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar title="Loading..." />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const formData = form.watch();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={templateId ? "Edit Template" : "Create Template"} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleCancel}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Templates
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {templateId ? "Edit Template" : "Create New Template"}
                  </h1>
                  <p className="text-gray-600">
                    {templateId ? "Update your signature template" : "Design a professional email signature"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? "Edit" : "Preview"}
                </Button>
                <Button onClick={form.handleSubmit(handleSave)} disabled={saveTemplateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </div>

            {previewMode ? (
              /* Preview Mode */
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Signature Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="signature-preview bg-white border rounded p-6">
                      <div dangerouslySetInnerHTML={{ __html: generateHtmlContent(formData) }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Edit Mode */
              <form onSubmit={form.handleSubmit(handleSave)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Editor Panel */}
                  <div className="space-y-6">
                    {/* Template Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Template Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Template Name</Label>
                          <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="Executive Template"
                          />
                          {form.formState.errors.name && (
                            <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => form.setValue("status", value as any)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 pt-8">
                            <input
                              type="checkbox"
                              id="isShared"
                              {...form.register("isShared")}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="isShared" className="text-sm">
                              Shared with team
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Signature Editor */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Signature Editor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="contact">Contact</TabsTrigger>
                            <TabsTrigger value="social">Social</TabsTrigger>
                          </TabsList>

                          <TabsContent value="basic" className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                {...form.register("fullName")}
                                placeholder="John Doe"
                              />
                              {form.formState.errors.fullName && (
                                <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="jobTitle">Job Title</Label>
                              <Input
                                id="jobTitle"
                                {...form.register("jobTitle")}
                                placeholder="Senior Marketing Manager"
                              />
                              {form.formState.errors.jobTitle && (
                                <p className="text-sm text-red-600">{form.formState.errors.jobTitle.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="company">Company</Label>
                              <Input
                                id="company"
                                {...form.register("company")}
                                placeholder="Acme Corporation"
                              />
                              {form.formState.errors.company && (
                                <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="logoUrl">Company Logo URL</Label>
                              <div className="flex space-x-2">
                                <Input
                                  id="logoUrl"
                                  {...form.register("logoUrl")}
                                  placeholder="https://example.com/logo.png"
                                />
                                <Button type="button" variant="outline" size="sm">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="contact" className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="email"
                                  type="email"
                                  className="pl-10"
                                  {...form.register("email")}
                                  placeholder="john@acme.com"
                                />
                              </div>
                              {form.formState.errors.email && (
                                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="phone"
                                  className="pl-10"
                                  {...form.register("phone")}
                                  placeholder="(555) 123-4567"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="website">Website</Label>
                              <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="website"
                                  className="pl-10"
                                  {...form.register("website")}
                                  placeholder="www.acme.com"
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="social" className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                              <div className="relative">
                                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="linkedIn"
                                  className="pl-10"
                                  {...form.register("linkedIn")}
                                  placeholder="https://linkedin.com/in/johndoe"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="twitter">Twitter Profile</Label>
                              <div className="relative">
                                <Twitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="twitter"
                                  className="pl-10"
                                  {...form.register("twitter")}
                                  placeholder="https://twitter.com/johndoe"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="instagram">Instagram Profile</Label>
                              <div className="relative">
                                <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="instagram"
                                  className="pl-10"
                                  {...form.register("instagram")}
                                  placeholder="https://instagram.com/johndoe"
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Preview Panel */}
                  <div className="lg:sticky lg:top-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Live Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="signature-preview bg-white border rounded p-4 min-h-[300px]">
                          <div dangerouslySetInnerHTML={{ __html: generateHtmlContent(formData) }} />
                        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={saveTemplateMutation.isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
