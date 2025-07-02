import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  Monitor,
  Smartphone
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
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
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
  const [previewFormat, setPreviewFormat] = useState<"desktop" | "mobile">("desktop");
  
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
      const templateData = {
        name: data.name,
        status: data.status,
        isShared: data.isShared,
        content: {
          fullName: data.fullName,
          jobTitle: data.jobTitle,
          company: data.company,
          email: data.email,
          phone: data.phone,
          website: data.website,
          linkedIn: data.linkedIn,
          twitter: data.twitter,
          instagram: data.instagram,
          logoUrl: data.logoUrl,
        },
        htmlContent: generateHtmlContent(data),
      };

      if (templateId) {
        return apiRequest(`/api/templates/${templateId}`, {
          method: "PATCH",
          body: JSON.stringify(templateData),
        });
      } else {
        return apiRequest("/api/templates", {
          method: "POST",
          body: JSON.stringify(templateData),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: templateId ? "Template updated successfully!" : "Template created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      if (templateId) {
        queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}`] });
      }
      setLocation("/templates");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: TemplateFormData) => {
    saveTemplateMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/templates");
  };

  const generateHtmlContent = (data: TemplateFormData): string => {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${data.logoUrl ? `
              <td style="padding-right: 20px; vertical-align: top;">
                <img src="${data.logoUrl}" alt="Company Logo" style="width: 80px; height: 80px; object-fit: contain;">
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <div style="margin-bottom: 5px;">
                <strong style="font-size: 18px; color: #2c3e50;">${data.fullName || 'Your Name'}</strong>
              </div>
              ${data.jobTitle ? `<div style="margin-bottom: 3px; color: #7f8c8d;">${data.jobTitle}</div>` : ''}
              ${data.company ? `<div style="margin-bottom: 8px; color: #7f8c8d;">${data.company}</div>` : ''}
              
              <div style="font-size: 14px;">
                ${data.email ? `<div style="margin-bottom: 2px;"><a href="mailto:${data.email}" style="color: #3498db; text-decoration: none;">${data.email}</a></div>` : ''}
                ${data.phone ? `<div style="margin-bottom: 2px;">${data.phone}</div>` : ''}
                ${data.website ? `<div style="margin-bottom: 2px;"><a href="${data.website}" style="color: #3498db; text-decoration: none;">${data.website}</a></div>` : ''}
              </div>
              
              ${(data.linkedIn || data.twitter || data.instagram) ? `
                <div style="margin-top: 10px;">
                  ${data.linkedIn ? `<a href="${data.linkedIn}" style="margin-right: 10px; color: #3498db; text-decoration: none;">LinkedIn</a>` : ''}
                  ${data.twitter ? `<a href="${data.twitter}" style="margin-right: 10px; color: #3498db; text-decoration: none;">Twitter</a>` : ''}
                  ${data.instagram ? `<a href="${data.instagram}" style="color: #3498db; text-decoration: none;">Instagram</a>` : ''}
                </div>
              ` : ''}
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar title="Loading..." />
          
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-48 w-full mb-6" />
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
            <div className="mb-6">
              <Button variant="ghost" onClick={handleCancel} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md">
                  <Input
                    id="template-name"
                    {...form.register("name")}
                    placeholder="Create New Template"
                    className="text-3xl font-bold text-gray-900 border-none bg-transparent p-0 shadow-none focus:border focus:bg-white focus:shadow-sm focus:p-3 focus:rounded-md transition-all"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select value={form.watch("status")} onValueChange={(value: "draft" | "active" | "archived") => form.setValue("status", value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={form.handleSubmit(handleSave)} disabled={saveTemplateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Panel - Full Width */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Live Preview</CardTitle>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    type="button"
                    variant={previewFormat === "desktop" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setPreviewFormat("desktop")}
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    type="button"
                    variant={previewFormat === "mobile" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setPreviewFormat("mobile")}
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    Mobile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`signature-preview bg-white border rounded p-4 h-48 ${
                  previewFormat === "mobile" 
                    ? "max-w-sm mx-auto" 
                    : "w-full"
                }`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: generateHtmlContent(formData) }} 
                    className={previewFormat === "mobile" ? "text-sm" : ""}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Signature Editor */}
            <form onSubmit={form.handleSubmit(handleSave)}>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            {...form.register("company")}
                            placeholder="Acme Corporation"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="logoUrl">Company Logo URL</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="logoUrl"
                              {...form.register("logoUrl")}
                              placeholder="https://example.com/logo.png"
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" size="icon">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              className="pl-10"
                              {...form.register("email")}
                              placeholder="john.doe@company.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              className="pl-10"
                              {...form.register("phone")}
                              placeholder="+1 (555) 123-4567"
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
                              placeholder="https://company.com"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}