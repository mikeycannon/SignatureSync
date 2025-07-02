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

// Formatting options for signature styling
const FORMATTING_OPTIONS = [
  { value: "modern", label: "Modern", icon: "💼", color: "bg-blue-500" },
  { value: "classic", label: "Classic", icon: "🏛️", color: "bg-gray-600" },
  { value: "creative", label: "Creative", icon: "🎨", color: "bg-purple-500" },
  { value: "minimal", label: "Minimal", icon: "◯", color: "bg-gray-400" },
  { value: "corporate", label: "Corporate", icon: "🏢", color: "bg-blue-700" },
  { value: "tech", label: "Tech", icon: "⚡", color: "bg-indigo-500" },
  { value: "elegant", label: "Elegant", icon: "✨", color: "bg-pink-500" },
  { value: "bold", label: "Bold", icon: "💪", color: "bg-red-500" },
  { value: "compact", label: "Compact", icon: "📏", color: "bg-green-500" },
  { value: "signature", label: "Signature", icon: "✍️", color: "bg-amber-600" },
  { value: "custom", label: "Custom", icon: "🎛️", color: "bg-violet-600" }
];

// Schema for form data (includes signature fields)
const templateFormSchema = z.object({
  // Template metadata
  name: z.string().min(1, "Template name is required"),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isShared: z.boolean().default(false),
  formatting: z.string().default("modern"),
  promotionalImage: z.string().optional(),
  promotionalLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  
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
  const [customStyles, setCustomStyles] = useState({
    nameSize: 18,
    nameColor: "#2563eb",
    nameFont: "Arial",
    roleSize: 14,
    roleColor: "#666666",
    companySize: 14,
    companyColor: "#666666",
    contactSize: 13,
    contactColor: "#333333",
    linkColor: "#2563eb",
    spacing: 8,
    padding: 0
  });
  const [editingElement, setEditingElement] = useState<string | null>(null);
  
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
      formatting: "custom",
      promotionalImage: "",
      promotionalLink: "",
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
        formatting: (template as any)?.formatting || "modern",
        promotionalImage: (template as any)?.promotionalImage || "",
        promotionalLink: (template as any)?.promotionalLink || "",
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
        formatting: data.formatting,
        promotionalImage: data.promotionalImage,
        promotionalLink: data.promotionalLink,
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
        return apiRequest(`/api/templates/${templateId}`, "PATCH", templateData);
      } else {
        return apiRequest("/api/templates", "POST", templateData);
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

  const generateInteractivePreview = (data: TemplateFormData) => {
    
    return (
      <div style={{ fontFamily: customStyles.nameFont + ', sans-serif', lineHeight: 1.5, color: '#333333', padding: customStyles.padding + 'px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {data.logoUrl && (
            <div style={{ paddingRight: '20px', verticalAlign: 'top' }}>
              <img src={data.logoUrl} alt="Image" style={{ height: '80px', maxWidth: '200px', objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ verticalAlign: 'top' }}>
            <div 
              onClick={() => setEditingElement(editingElement === 'name' ? null : 'name')}
              style={{ 
                fontSize: customStyles.nameSize + 'px', 
                fontWeight: 600, 
                color: customStyles.nameColor, 
                marginBottom: customStyles.spacing + 'px',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                border: editingElement === 'name' ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {data.fullName || 'Your Name'}
            </div>
            
            {data.jobTitle && (
              <div 
                onClick={() => setEditingElement(editingElement === 'role' ? null : 'role')}
                style={{ 
                  fontSize: customStyles.roleSize + 'px', 
                  color: customStyles.roleColor, 
                  marginBottom: (customStyles.spacing/2) + 'px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  border: editingElement === 'role' ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {data.jobTitle}
              </div>
            )}
            
            {data.company && (
              <div 
                onClick={() => setEditingElement(editingElement === 'company' ? null : 'company')}
                style={{ 
                  fontSize: customStyles.companySize + 'px', 
                  color: customStyles.companyColor, 
                  marginBottom: customStyles.spacing + 'px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  border: editingElement === 'company' ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {data.company}
              </div>
            )}
            
            <div 
              onClick={() => setEditingElement(editingElement === 'contact' ? null : 'contact')}
              style={{ 
                fontSize: customStyles.contactSize + 'px', 
                color: customStyles.contactColor,
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                border: editingElement === 'contact' ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {data.email && <div style={{ marginBottom: '2px' }}><span style={{ color: customStyles.linkColor, textDecoration: 'none', cursor: 'default' }}>{data.email}</span></div>}
              {data.phone && <div style={{ marginBottom: '2px' }}>{data.phone}</div>}
              {data.website && <div style={{ marginBottom: '2px' }}><span style={{ color: customStyles.linkColor, textDecoration: 'none', cursor: 'default' }}>{data.website}</span></div>}
            </div>
            
            {(data.linkedIn || data.twitter || data.instagram) && (
              <div 
                onClick={() => setEditingElement(editingElement === 'social' ? null : 'social')}
                style={{ 
                  marginTop: customStyles.spacing + 'px', 
                  fontSize: customStyles.contactSize + 'px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  border: editingElement === 'social' ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {data.linkedIn && <span style={{ color: customStyles.linkColor, textDecoration: 'none', marginRight: '10px', cursor: 'default' }}>LinkedIn</span>}
                {data.twitter && <span style={{ color: customStyles.linkColor, textDecoration: 'none', marginRight: '10px', cursor: 'default' }}>Twitter</span>}
                {data.instagram && <span style={{ color: customStyles.linkColor, textDecoration: 'none', cursor: 'default' }}>Instagram</span>}
              </div>
            )}
          </div>
        </div>
        
        {data.promotionalImage && (
          <div style={{ marginTop: '15px' }}>
            <img src={data.promotionalImage} alt="Promotional Banner" style={{ maxWidth: '100%', height: 'auto', border: 'none', cursor: 'default' }} />
          </div>
        )}
      </div>
    );
  };

  const generateHtmlContent = (data: TemplateFormData): string => {
    const getFormattingStyles = (formatting: string) => {
      const styles = {
        modern: {
          container: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a;",
          name: "font-size: 18px; font-weight: 600; color: #2563eb; margin-bottom: 4px;",
          role: "font-size: 14px; color: #6b7280; margin-bottom: 2px;",
          company: "font-size: 14px; color: #6b7280; margin-bottom: 8px;",
          contact: "font-size: 13px; color: #374151;",
          link: "color: #2563eb; text-decoration: none;",
          social: "margin-top: 8px; font-size: 13px;"
        },
        classic: {
          container: "font-family: 'Times New Roman', serif; line-height: 1.4; color: #2c3e50;",
          name: "font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 6px;",
          role: "font-size: 15px; color: #7f8c8d; margin-bottom: 3px; font-style: italic;",
          company: "font-size: 15px; color: #7f8c8d; margin-bottom: 10px;",
          contact: "font-size: 14px; color: #2c3e50;",
          link: "color: #c0392b; text-decoration: underline;",
          social: "margin-top: 10px; font-size: 14px;"
        },
        creative: {
          container: "font-family: 'Arial', sans-serif; line-height: 1.5; color: #2d3748; background: linear-gradient(90deg, #f7fafc 0%, #edf2f7 100%); padding: 15px; border-radius: 8px;",
          name: "font-size: 22px; font-weight: bold; color: #e53e3e; margin-bottom: 5px;",
          role: "font-size: 14px; color: #805ad5; margin-bottom: 3px; font-weight: 500;",
          company: "font-size: 14px; color: #38a169; margin-bottom: 8px; font-weight: 500;",
          contact: "font-size: 13px; color: #2d3748;",
          link: "color: #ed8936; text-decoration: none; font-weight: 500;",
          social: "margin-top: 10px; font-size: 13px;"
        },
        minimal: {
          container: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.4; color: #333;",
          name: "font-size: 16px; font-weight: 400; color: #333; margin-bottom: 2px;",
          role: "font-size: 13px; color: #666; margin-bottom: 1px;",
          company: "font-size: 13px; color: #666; margin-bottom: 6px;",
          contact: "font-size: 12px; color: #666;",
          link: "color: #333; text-decoration: none;",
          social: "margin-top: 6px; font-size: 12px;"
        },
        corporate: {
          container: "font-family: 'Calibri', 'Trebuchet MS', sans-serif; line-height: 1.5; color: #003366; border-left: 4px solid #0066cc; padding-left: 15px;",
          name: "font-size: 19px; font-weight: bold; color: #003366; margin-bottom: 5px;",
          role: "font-size: 14px; color: #0066cc; margin-bottom: 3px; font-weight: 600;",
          company: "font-size: 15px; color: #003366; margin-bottom: 8px; font-weight: 500;",
          contact: "font-size: 13px; color: #003366;",
          link: "color: #0066cc; text-decoration: none;",
          social: "margin-top: 8px; font-size: 13px;"
        },
        tech: {
          container: "font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px;",
          name: "font-size: 18px; font-weight: 600; color: #7c3aed; margin-bottom: 4px;",
          role: "font-size: 14px; color: #059669; margin-bottom: 2px;",
          company: "font-size: 14px; color: #dc2626; margin-bottom: 8px;",
          contact: "font-size: 13px; color: #374151;",
          link: "color: #2563eb; text-decoration: none;",
          social: "margin-top: 8px; font-size: 13px;"
        },
        elegant: {
          container: "font-family: 'Georgia', serif; line-height: 1.7; color: #4a5568; background: #fefefe; padding: 20px; border: 1px solid #e2e8f0;",
          name: "font-size: 24px; font-weight: 300; color: #2d3748; margin-bottom: 8px; letter-spacing: 0.5px;",
          role: "font-size: 16px; color: #718096; margin-bottom: 4px; font-style: italic;",
          company: "font-size: 16px; color: #718096; margin-bottom: 12px;",
          contact: "font-size: 14px; color: #4a5568;",
          link: "color: #805ad5; text-decoration: none;",
          social: "margin-top: 12px; font-size: 14px;"
        },
        bold: {
          container: "font-family: 'Impact', 'Arial Black', sans-serif; line-height: 1.4; color: #1a202c; background: #fed7d7; padding: 15px; border: 3px solid #e53e3e;",
          name: "font-size: 24px; font-weight: 900; color: #e53e3e; margin-bottom: 6px; text-transform: uppercase;",
          role: "font-size: 16px; color: #1a202c; margin-bottom: 4px; font-weight: bold;",
          company: "font-size: 16px; color: #1a202c; margin-bottom: 10px; font-weight: bold;",
          contact: "font-size: 14px; color: #1a202c; font-weight: 600;",
          link: "color: #e53e3e; text-decoration: none; font-weight: bold;",
          social: "margin-top: 10px; font-size: 14px; font-weight: bold;"
        },
        compact: {
          container: "font-family: 'Arial', sans-serif; line-height: 1.3; color: #333; font-size: 12px;",
          name: "font-size: 14px; font-weight: bold; color: #333; margin-bottom: 2px;",
          role: "font-size: 11px; color: #666; margin-bottom: 1px;",
          company: "font-size: 11px; color: #666; margin-bottom: 4px;",
          contact: "font-size: 11px; color: #666;",
          link: "color: #0066cc; text-decoration: none;",
          social: "margin-top: 4px; font-size: 11px;"
        },
        signature: {
          container: "font-family: 'Brush Script MT', cursive; line-height: 1.8; color: #2c3e50;",
          name: "font-size: 28px; font-weight: normal; color: #8b4513; margin-bottom: 8px;",
          role: "font-size: 16px; color: #2c3e50; margin-bottom: 4px; font-family: 'Georgia', serif;",
          company: "font-size: 16px; color: #2c3e50; margin-bottom: 10px; font-family: 'Georgia', serif;",
          contact: "font-size: 14px; color: #2c3e50; font-family: 'Georgia', serif;",
          link: "color: #8b4513; text-decoration: none;",
          social: "margin-top: 10px; font-size: 14px; font-family: 'Georgia', serif;"
        },
        custom: {
          container: `font-family: ${customStyles.nameFont}, sans-serif; line-height: 1.5; color: #333333; padding: ${customStyles.padding}px;`,
          name: `font-size: ${customStyles.nameSize}px; font-weight: 600; color: ${customStyles.nameColor}; margin-bottom: ${customStyles.spacing}px;`,
          role: `font-size: ${customStyles.roleSize}px; color: ${customStyles.roleColor}; margin-bottom: ${customStyles.spacing/2}px;`,
          company: `font-size: ${customStyles.companySize}px; color: ${customStyles.companyColor}; margin-bottom: ${customStyles.spacing}px;`,
          contact: `font-size: ${customStyles.contactSize}px; color: ${customStyles.contactColor};`,
          link: `color: ${customStyles.linkColor}; text-decoration: none;`,
          social: `margin-top: ${customStyles.spacing}px; font-size: ${customStyles.contactSize}px;`
        }
      };
      return styles[formatting as keyof typeof styles] || styles.modern;
    };

    const styles = getFormattingStyles(data.formatting || 'modern');
    
    let signatureHtml = `
      <div style="${styles.container}">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${data.logoUrl ? `
              <td style="padding-right: 20px; vertical-align: top;">
                <img src="${data.logoUrl}" alt="Image" style="height: 80px; max-width: 200px; object-fit: contain;">
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <div style="${styles.name}">
                ${data.fullName || 'Your Name'}
              </div>
              ${data.jobTitle ? `<div style="${styles.role}">${data.jobTitle}</div>` : ''}
              ${data.company ? `<div style="${styles.company}">${data.company}</div>` : ''}
              
              <div style="${styles.contact}">
                ${data.email ? `<div style="margin-bottom: 2px;"><a href="mailto:${data.email}" style="${styles.link}">${data.email}</a></div>` : ''}
                ${data.phone ? `<div style="margin-bottom: 2px;">${data.phone}</div>` : ''}
                ${data.website ? `<div style="margin-bottom: 2px;"><a href="${data.website}" style="${styles.link}">${data.website}</a></div>` : ''}
              </div>
              
              ${(data.linkedIn || data.twitter || data.instagram) ? `
                <div style="${styles.social}">
                  ${data.linkedIn ? `<a href="${data.linkedIn}" style="${styles.link}; margin-right: 10px;">LinkedIn</a>` : ''}
                  ${data.twitter ? `<a href="${data.twitter}" style="${styles.link}; margin-right: 10px;">Twitter</a>` : ''}
                  ${data.instagram ? `<a href="${data.instagram}" style="${styles.link};">Instagram</a>` : ''}
                </div>
              ` : ''}
            </td>
          </tr>
        </table>
      </div>
    `;

    // Add promotional image if provided
    if (data.promotionalImage) {
      const promoContent = data.promotionalLink 
        ? `<a href="${data.promotionalLink}" target="_blank" style="display: block; margin-top: 15px;">
             <img src="${data.promotionalImage}" alt="Promotional Banner" style="max-width: 100%; height: auto; border: none;">
           </a>`
        : `<div style="margin-top: 15px;">
             <img src="${data.promotionalImage}" alt="Promotional Banner" style="max-width: 100%; height: auto; border: none;">
           </div>`;
      
      signatureHtml += promoContent;
    }

    return signatureHtml;
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
                <div className={`signature-preview bg-white border rounded p-4 min-h-32 ${
                  previewFormat === "mobile" 
                    ? "max-w-sm mx-auto" 
                    : "w-full"
                }`}>
                  {form.watch("formatting") === "custom" ? (
                    <div className={previewFormat === "mobile" ? "text-sm" : ""}>
                      {generateInteractivePreview(formData)}
                    </div>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ __html: generateHtmlContent(formData) }} 
                      className={previewFormat === "mobile" ? "text-sm" : ""}
                    />
                  )}
                </div>
                
                {/* Compact Style Editor - appears when element is clicked */}
                {editingElement && form.watch("formatting") === "custom" && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm text-blue-900">
                        Editing: {editingElement === 'name' ? 'Name' : 
                                 editingElement === 'role' ? 'Job Title' : 
                                 editingElement === 'company' ? 'Company' : 
                                 editingElement === 'contact' ? 'Contact Info' : 'Social Links'}
                      </h4>
                      <button 
                        onClick={() => setEditingElement(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {(editingElement === 'name' || editingElement === 'role' || editingElement === 'company' || editingElement === 'contact') && (
                        <>
                          <div>
                            <Label className="text-xs text-blue-700">
                              Size: {editingElement === 'name' ? customStyles.nameSize : 
                                     editingElement === 'role' ? customStyles.roleSize : 
                                     editingElement === 'company' ? customStyles.companySize : customStyles.contactSize}px
                            </Label>
                            <input
                              type="range"
                              min="10"
                              max={editingElement === 'name' ? "32" : "24"}
                              value={editingElement === 'name' ? customStyles.nameSize : 
                                     editingElement === 'role' ? customStyles.roleSize : 
                                     editingElement === 'company' ? customStyles.companySize : customStyles.contactSize}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (editingElement === 'name') setCustomStyles({...customStyles, nameSize: value});
                                else if (editingElement === 'role') setCustomStyles({...customStyles, roleSize: value});
                                else if (editingElement === 'company') setCustomStyles({...customStyles, companySize: value});
                                else setCustomStyles({...customStyles, contactSize: value});
                              }}
                              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-blue-700">Color</Label>
                            <input
                              type="color"
                              value={editingElement === 'name' ? customStyles.nameColor : 
                                     editingElement === 'role' ? customStyles.roleColor : 
                                     editingElement === 'company' ? customStyles.companyColor : customStyles.contactColor}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (editingElement === 'name') setCustomStyles({...customStyles, nameColor: value});
                                else if (editingElement === 'role') setCustomStyles({...customStyles, roleColor: value});
                                else if (editingElement === 'company') setCustomStyles({...customStyles, companyColor: value});
                                else setCustomStyles({...customStyles, contactColor: value});
                              }}
                              className="w-full h-8 rounded border border-blue-300"
                            />
                          </div>
                        </>
                      )}
                      
                      {(editingElement === 'contact' || editingElement === 'social') && (
                        <div>
                          <Label className="text-xs text-blue-700">Link Color</Label>
                          <input
                            type="color"
                            value={customStyles.linkColor}
                            onChange={(e) => setCustomStyles({...customStyles, linkColor: e.target.value})}
                            className="w-full h-8 rounded border border-blue-300"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs text-blue-700">Spacing: {customStyles.spacing}px</Label>
                        <input
                          type="range"
                          min="2"
                          max="20"
                          value={customStyles.spacing}
                          onChange={(e) => setCustomStyles({...customStyles, spacing: parseInt(e.target.value)})}
                          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Selection */}
            <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {FORMATTING_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex-shrink-0 flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                    form.watch("formatting") === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => form.setValue("formatting", option.value)}
                >
                  <div className={`w-8 h-8 rounded-lg ${option.color} flex items-center justify-center text-white text-lg`}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{option.label}</span>
                </div>
              ))}
            </div>

            {/* Interactive Styling Hint */}
            {form.watch("formatting") === "custom" && !editingElement && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">💡 Tip:</span> Click any element in the preview above to customize its style (size, color, spacing)
                </p>
              </div>
            )}

            {/* Signature Editor */}
            <form onSubmit={form.handleSubmit(handleSave)}>
              <Card>
                <CardHeader>
                  <CardTitle>Signature Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                      <TabsTrigger value="social">Social</TabsTrigger>
                      <TabsTrigger value="promotional">Promotion</TabsTrigger>
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
                          <Label htmlFor="logoUrl">Image</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="logoUrl"
                              {...form.register("logoUrl")}
                              placeholder="https://example.com/image.png"
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

                    {/* Promotional Tab */}
                    <TabsContent value="promotional" className="space-y-4">
                      <div>
                        <Label htmlFor="promotional-image">Promotional Image URL</Label>
                        <div className="mt-1">
                          <Input
                            id="promotional-image"
                            {...form.register("promotionalImage")}
                            placeholder="https://example.com/promo-banner.jpg"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Add a promotional image that will appear below your signature
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="promotional-link">Promotional Link</Label>
                        <div className="mt-1">
                          <Input
                            id="promotional-link"
                            {...form.register("promotionalLink")}
                            placeholder="https://example.com/special-offer"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            The promotional image will link to this URL when clicked
                          </p>
                        </div>
                        {form.formState.errors.promotionalLink && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.promotionalLink.message}</p>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Promotional Image Tips</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <ul className="list-disc list-inside space-y-1">
                                <li>Use high-quality images (recommended: 600x200px)</li>
                                <li>Keep file size under 1MB for better email delivery</li>
                                <li>Test the image URL before saving</li>
                                <li>Ensure the promotional link works correctly</li>
                              </ul>
                            </div>
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