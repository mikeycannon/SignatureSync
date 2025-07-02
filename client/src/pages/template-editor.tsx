import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  { value: "custom", label: "Custom", color: "bg-purple-500", icon: "🎨" },
  { value: "modern", label: "Modern", color: "bg-blue-500", icon: "💼" },
  { value: "classic", label: "Classic", color: "bg-gray-500", icon: "📰" },
  { value: "creative", label: "Creative", color: "bg-pink-500", icon: "🎭" },
  { value: "minimal", label: "Minimal", color: "bg-green-500", icon: "✨" },
  { value: "corporate", label: "Corporate", color: "bg-indigo-500", icon: "🏢" },
  { value: "tech", label: "Tech", color: "bg-purple-600", icon: "💻" },
  { value: "elegant", label: "Elegant", color: "bg-rose-500", icon: "👔" },
  { value: "bold", label: "Bold", color: "bg-red-500", icon: "⚡" },
  { value: "compact", label: "Compact", color: "bg-yellow-500", icon: "📱" },
  { value: "signature", label: "Signature", color: "bg-amber-600", icon: "✍️" }
];

// Schema for template form data
const templateFormSchema = insertSignatureTemplateSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedIn: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  logoUrl: z.string().optional(),
  promotionalImage: z.string().optional(),
  promotionalLink: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateEditorProps {
  templateId?: number;
}

export default function TemplateEditor({ templateId }: TemplateEditorProps) {
  const [, setLocation] = useLocation();
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
    padding: 0,
    logoRadius: 0,
    promoHeight: 80
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
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const url = templateId ? `/api/templates/${templateId}` : '/api/templates';
      const method = templateId ? 'PUT' : 'POST';
      return apiRequest(url, { method, body: data });
    },
    onSuccess: () => {
      toast({ 
        title: templateId ? "Template updated" : "Template created",
        description: templateId ? "Your template has been updated successfully." : "Your new template has been created."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setLocation("/templates");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        status: template.status as "draft" | "active" | "archived",
        isShared: template.isShared,
        formatting: template.formatting,
        promotionalImage: template.promotionalImage || "",
        promotionalLink: template.promotionalLink || "",
        fullName: template.fullName || "",
        jobTitle: template.jobTitle || "",
        company: template.company || "",
        email: template.email || "",
        phone: template.phone || "",
        website: template.website || "",
        linkedIn: template.linkedIn || "",
        twitter: template.twitter || "",
        instagram: template.instagram || "",
        logoUrl: template.logoUrl || "",
      });
    }
  }, [template, form]);

  const handleSave = (data: TemplateFormData) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/templates");
  };

  const generateInteractivePreview = (data: TemplateFormData) => {
    return (
      <div style={{ fontFamily: customStyles.nameFont + ', sans-serif', lineHeight: 1.5, color: '#333333', padding: customStyles.padding + 'px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {data.logoUrl && (
            <div 
              onClick={() => setEditingElement(editingElement === 'logo' ? null : 'logo')}
              style={{ 
                paddingRight: '20px', 
                verticalAlign: 'top',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                border: editingElement === 'logo' ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <img 
                src={data.logoUrl} 
                alt="Image" 
                style={{ 
                  height: '80px', 
                  maxWidth: '200px', 
                  objectFit: 'contain',
                  borderRadius: customStyles.logoRadius + 'px'
                }} 
              />
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
                padding: '2px',
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
                  marginBottom: customStyles.spacing * 0.5 + 'px',
                  cursor: 'pointer',
                  padding: '2px',
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
                  padding: '2px',
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
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                border: editingElement === 'contact' ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {data.email && (
                <div style={{ fontSize: customStyles.contactSize + 'px', color: customStyles.contactColor, marginBottom: '2px' }}>
                  📧 <span style={{ color: customStyles.linkColor }}>{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div style={{ fontSize: customStyles.contactSize + 'px', color: customStyles.contactColor, marginBottom: '2px' }}>
                  📞 {data.phone}
                </div>
              )}
              {data.website && (
                <div style={{ fontSize: customStyles.contactSize + 'px', color: customStyles.contactColor, marginBottom: '2px' }}>
                  🌐 <span style={{ color: customStyles.linkColor }}>{data.website}</span>
                </div>
              )}
              {(data.linkedIn || data.twitter || data.instagram) && (
                <div style={{ fontSize: customStyles.contactSize + 'px', color: customStyles.contactColor, marginTop: '4px' }}>
                  {data.linkedIn && <span style={{ marginRight: '8px', color: customStyles.linkColor }}>LinkedIn</span>}
                  {data.twitter && <span style={{ marginRight: '8px', color: customStyles.linkColor }}>Twitter</span>}
                  {data.instagram && <span style={{ color: customStyles.linkColor }}>Instagram</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {data.promotionalImage && (
          <div 
            onClick={() => setEditingElement(editingElement === 'promo' ? null : 'promo')}
            style={{ 
              marginTop: '15px',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              border: editingElement === 'promo' ? '2px solid #2563eb' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <img 
              src={data.promotionalImage} 
              alt="Promotional Banner" 
              style={{ 
                maxWidth: '100%', 
                height: customStyles.promoHeight + 'px', 
                objectFit: 'cover',
                border: 'none' 
              }} 
            />
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
          social: "margin-top: 8px; font-size: 13px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        classic: {
          container: "font-family: 'Times New Roman', serif; line-height: 1.4; color: #2c3e50;",
          name: "font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 6px;",
          role: "font-size: 15px; color: #7f8c8d; margin-bottom: 3px; font-style: italic;",
          company: "font-size: 15px; color: #7f8c8d; margin-bottom: 10px;",
          contact: "font-size: 14px; color: #2c3e50;",
          link: "color: #c0392b; text-decoration: underline;",
          social: "margin-top: 10px; font-size: 14px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        creative: {
          container: "font-family: 'Arial', sans-serif; line-height: 1.5; color: #2d3748; background: linear-gradient(90deg, #f7fafc 0%, #edf2f7 100%); padding: 15px; border-radius: 8px;",
          name: "font-size: 22px; font-weight: bold; color: #e53e3e; margin-bottom: 5px;",
          role: "font-size: 14px; color: #805ad5; margin-bottom: 3px; font-weight: 500;",
          company: "font-size: 14px; color: #38a169; margin-bottom: 8px; font-weight: 500;",
          contact: "font-size: 13px; color: #2d3748;",
          link: "color: #ed8936; text-decoration: none; font-weight: 500;",
          social: "margin-top: 10px; font-size: 13px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        minimal: {
          container: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.4; color: #333;",
          name: "font-size: 16px; font-weight: 400; color: #333; margin-bottom: 2px;",
          role: "font-size: 13px; color: #666; margin-bottom: 1px;",
          company: "font-size: 13px; color: #666; margin-bottom: 6px;",
          contact: "font-size: 12px; color: #666;",
          link: "color: #333; text-decoration: none;",
          social: "margin-top: 6px; font-size: 12px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        corporate: {
          container: "font-family: 'Calibri', 'Trebuchet MS', sans-serif; line-height: 1.5; color: #003366; border-left: 4px solid #0066cc; padding-left: 15px;",
          name: "font-size: 19px; font-weight: bold; color: #003366; margin-bottom: 5px;",
          role: "font-size: 14px; color: #0066cc; margin-bottom: 3px; font-weight: 600;",
          company: "font-size: 15px; color: #003366; margin-bottom: 8px; font-weight: 500;",
          contact: "font-size: 13px; color: #003366;",
          link: "color: #0066cc; text-decoration: none;",
          social: "margin-top: 8px; font-size: 13px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        tech: {
          container: "font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px;",
          name: "font-size: 18px; font-weight: 600; color: #7c3aed; margin-bottom: 4px;",
          role: "font-size: 14px; color: #059669; margin-bottom: 2px;",
          company: "font-size: 14px; color: #dc2626; margin-bottom: 8px;",
          contact: "font-size: 13px; color: #374151;",
          link: "color: #2563eb; text-decoration: none;",
          social: "margin-top: 8px; font-size: 13px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        elegant: {
          container: "font-family: 'Georgia', serif; line-height: 1.7; color: #4a5568; background: #fefefe; padding: 20px; border: 1px solid #e2e8f0;",
          name: "font-size: 24px; font-weight: 300; color: #2d3748; margin-bottom: 8px; letter-spacing: 0.5px;",
          role: "font-size: 16px; color: #718096; margin-bottom: 4px; font-style: italic;",
          company: "font-size: 16px; color: #718096; margin-bottom: 12px;",
          contact: "font-size: 14px; color: #4a5568;",
          link: "color: #805ad5; text-decoration: none;",
          social: "margin-top: 12px; font-size: 14px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        bold: {
          container: "font-family: 'Impact', 'Arial Black', sans-serif; line-height: 1.4; color: #1a202c; background: #fed7d7; padding: 15px; border: 3px solid #e53e3e;",
          name: "font-size: 24px; font-weight: 900; color: #e53e3e; margin-bottom: 6px; text-transform: uppercase;",
          role: "font-size: 16px; color: #1a202c; margin-bottom: 4px; font-weight: bold;",
          company: "font-size: 16px; color: #1a202c; margin-bottom: 10px; font-weight: bold;",
          contact: "font-size: 14px; color: #1a202c; font-weight: 600;",
          link: "color: #e53e3e; text-decoration: none; font-weight: bold;",
          social: "margin-top: 10px; font-size: 14px; font-weight: bold;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        compact: {
          container: "font-family: 'Arial', sans-serif; line-height: 1.3; color: #333; font-size: 12px;",
          name: "font-size: 14px; font-weight: bold; color: #333; margin-bottom: 2px;",
          role: "font-size: 11px; color: #666; margin-bottom: 1px;",
          company: "font-size: 11px; color: #666; margin-bottom: 4px;",
          contact: "font-size: 11px; color: #666;",
          link: "color: #0066cc; text-decoration: none;",
          social: "margin-top: 4px; font-size: 11px;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        signature: {
          container: "font-family: 'Brush Script MT', cursive; line-height: 1.8; color: #2c3e50;",
          name: "font-size: 28px; font-weight: normal; color: #8b4513; margin-bottom: 8px;",
          role: "font-size: 16px; color: #2c3e50; margin-bottom: 4px; font-family: 'Georgia', serif;",
          company: "font-size: 16px; color: #2c3e50; margin-bottom: 10px; font-family: 'Georgia', serif;",
          contact: "font-size: 14px; color: #2c3e50; font-family: 'Georgia', serif;",
          link: "color: #8b4513; text-decoration: none;",
          social: "margin-top: 10px; font-size: 14px; font-family: 'Georgia', serif;",
          logo: "height: 80px; max-width: 200px; object-fit: contain;",
          promo: "max-width: 100%; height: auto; border: none;"
        },
        custom: {
          container: `font-family: ${customStyles.nameFont}, sans-serif; line-height: 1.5; color: #333333; padding: ${customStyles.padding}px;`,
          name: `font-size: ${customStyles.nameSize}px; font-weight: 600; color: ${customStyles.nameColor}; margin-bottom: ${customStyles.spacing}px;`,
          role: `font-size: ${customStyles.roleSize}px; color: ${customStyles.roleColor}; margin-bottom: ${customStyles.spacing * 0.5}px;`,
          company: `font-size: ${customStyles.companySize}px; color: ${customStyles.companyColor}; margin-bottom: ${customStyles.spacing}px;`,
          contact: `font-size: ${customStyles.contactSize}px; color: ${customStyles.contactColor};`,
          link: `color: ${customStyles.linkColor}; text-decoration: none;`,
          social: `margin-top: ${customStyles.spacing}px; font-size: ${customStyles.contactSize}px;`,
          logo: `height: 80px; max-width: 200px; object-fit: contain; border-radius: ${customStyles.logoRadius}px;`,
          promo: `max-width: 100%; height: ${customStyles.promoHeight}px; object-fit: cover; border: none;`
        }
      };
      return styles[formatting as keyof typeof styles] || styles.modern;
    };

    const styles = getFormattingStyles(data.formatting);

    let signatureHtml = `
      <div style="${styles.container}">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${data.logoUrl ? `
              <td style="padding-right: 20px; vertical-align: top;">
                <img src="${data.logoUrl}" alt="Image" style="${(styles as any).logo || 'height: 80px; max-width: 200px; object-fit: contain;'}">
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <div style="${styles.name}">${data.fullName || 'Your Name'}</div>
              ${data.jobTitle ? `<div style="${styles.role}">${data.jobTitle}</div>` : ''}
              ${data.company ? `<div style="${styles.company}">${data.company}</div>` : ''}
              <div style="${styles.contact}">
                ${data.email ? `<div style="margin-bottom: 2px;">📧 <a href="mailto:${data.email}" style="${styles.link}">${data.email}</a></div>` : ''}
                ${data.phone ? `<div style="margin-bottom: 2px;">📞 ${data.phone}</div>` : ''}
                ${data.website ? `<div style="margin-bottom: 2px;">🌐 <a href="${data.website}" style="${styles.link}">${data.website}</a></div>` : ''}
                ${(data.linkedIn || data.twitter || data.instagram) ? `
                  <div style="${styles.social}">
                    ${data.linkedIn ? `<a href="${data.linkedIn}" style="${styles.link}; margin-right: 8px;">LinkedIn</a>` : ''}
                    ${data.twitter ? `<a href="${data.twitter}" style="${styles.link}; margin-right: 8px;">Twitter</a>` : ''}
                    ${data.instagram ? `<a href="${data.instagram}" style="${styles.link};">Instagram</a>` : ''}
                  </div>
                ` : ''}
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Add promotional image if provided
    if (data.promotionalImage) {
      const promoContent = data.promotionalLink 
        ? `<a href="${data.promotionalLink}" target="_blank" style="display: block; margin-top: 15px;">
             <img src="${data.promotionalImage}" alt="Promotional Banner" style="${(styles as any).promo || 'max-width: 100%; height: auto; border: none;'}">
           </a>`
        : `<div style="margin-top: 15px;">
             <img src="${data.promotionalImage}" alt="Promotional Banner" style="${(styles as any).promo || 'max-width: 100%; height: auto; border: none;'}">
           </div>`;
      
      signatureHtml += promoContent;
    }

    return signatureHtml;
  };

  const renderStyleControls = () => {
    if (!editingElement || form.watch("formatting") !== "custom") {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-blue-900">
            Editing: {editingElement === 'name' ? 'Name' : 
                      editingElement === 'role' ? 'Job Title' : 
                      editingElement === 'company' ? 'Company' : 
                      editingElement === 'contact' ? 'Contact' : 
                      editingElement === 'logo' ? 'Image' :
                      editingElement === 'promo' ? 'Promotional Image' : 'Element'}
          </h4>
          <button
            type="button"
            onClick={() => setEditingElement(null)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Text Element Controls */}
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
                  max="32"
                  value={editingElement === 'name' ? customStyles.nameSize : 
                         editingElement === 'role' ? customStyles.roleSize : 
                         editingElement === 'company' ? customStyles.companySize : customStyles.contactSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    if (editingElement === 'name') setCustomStyles({...customStyles, nameSize: newSize});
                    else if (editingElement === 'role') setCustomStyles({...customStyles, roleSize: newSize});
                    else if (editingElement === 'company') setCustomStyles({...customStyles, companySize: newSize});
                    else if (editingElement === 'contact') setCustomStyles({...customStyles, contactSize: newSize});
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
                    const newColor = e.target.value;
                    if (editingElement === 'name') setCustomStyles({...customStyles, nameColor: newColor});
                    else if (editingElement === 'role') setCustomStyles({...customStyles, roleColor: newColor});
                    else if (editingElement === 'company') setCustomStyles({...customStyles, companyColor: newColor});
                    else if (editingElement === 'contact') setCustomStyles({...customStyles, contactColor: newColor});
                  }}
                  className="w-full h-8 border border-blue-300 rounded cursor-pointer"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-700">Font</Label>
                <Select 
                  value={editingElement === 'name' ? customStyles.nameFont : 'Arial'} 
                  onValueChange={(value) => {
                    if (editingElement === 'name') setCustomStyles({...customStyles, nameFont: value});
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Calibri">Calibri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {/* Logo/Image Controls */}
          {editingElement === 'logo' && (
            <div>
              <Label className="text-xs text-blue-700">Corner Radius: {customStyles.logoRadius}px</Label>
              <input
                type="range"
                min="0"
                max="20"
                value={customStyles.logoRadius}
                onChange={(e) => setCustomStyles({...customStyles, logoRadius: parseInt(e.target.value)})}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
          
          {/* Promotional Image Controls */}
          {editingElement === 'promo' && (
            <div>
              <Label className="text-xs text-blue-700">Height: {customStyles.promoHeight}px</Label>
              <input
                type="range"
                min="40"
                max="200"
                value={customStyles.promoHeight}
                onChange={(e) => setCustomStyles({...customStyles, promoHeight: parseInt(e.target.value)})}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
          
          {/* Spacing Control for all elements */}
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
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar title="Loading..." />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-96 w-full" />
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
                  
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={form.handleSubmit(handleSave)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {templateId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Layout: Preview (8/12) + Editor (4/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Preview (8/12 width) */}
              <div className="lg:col-span-8">
                <Card>
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
                    {renderStyleControls()}

                    {/* Style Selection */}
                    <div className="mt-4 flex overflow-x-auto space-x-3 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Signature Editor (4/12 width) */}
              <div className="lg:col-span-4">
                <form onSubmit={form.handleSubmit(handleSave)}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Signature Editor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                          Basic Information
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                            <Input
                              id="fullName"
                              {...form.register("fullName")}
                              placeholder="John Doe"
                              className="text-sm"
                            />
                            {form.formState.errors.fullName && (
                              <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="jobTitle" className="text-sm">Job Title</Label>
                            <Input
                              id="jobTitle"
                              {...form.register("jobTitle")}
                              placeholder="Marketing Manager"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company" className="text-sm">Company</Label>
                            <Input
                              id="company"
                              {...form.register("company")}
                              placeholder="Acme Corp"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="email"
                                className="pl-10 text-sm"
                                {...form.register("email")}
                                placeholder="john.doe@company.com"
                              />
                            </div>
                            {form.formState.errors.email && (
                              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="phone"
                                className="pl-10 text-sm"
                                {...form.register("phone")}
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website" className="text-sm">Website</Label>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="website"
                                className="pl-10 text-sm"
                                {...form.register("website")}
                                placeholder="https://company.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Social Media Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                          Social Media
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="linkedIn" className="text-sm">LinkedIn Profile</Label>
                            <div className="relative">
                              <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="linkedIn"
                                className="pl-10 text-sm"
                                {...form.register("linkedIn")}
                                placeholder="https://linkedin.com/in/johndoe"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="twitter" className="text-sm">Twitter Profile</Label>
                            <div className="relative">
                              <Twitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="twitter"
                                className="pl-10 text-sm"
                                {...form.register("twitter")}
                                placeholder="https://twitter.com/johndoe"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-sm">Instagram Profile</Label>
                            <div className="relative">
                              <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="instagram"
                                className="pl-10 text-sm"
                                {...form.register("instagram")}
                                placeholder="https://instagram.com/johndoe"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assets Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                          Assets
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="logoUrl" className="text-sm">Company Logo URL</Label>
                            <Input
                              id="logoUrl"
                              placeholder="https://example.com/logo.png"
                              className="text-sm"
                              {...form.register("logoUrl")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="promotional-image" className="text-sm">Promotional Image URL</Label>
                            <Input
                              id="promotional-image"
                              {...form.register("promotionalImage")}
                              placeholder="https://example.com/promo-banner.jpg"
                              className="text-sm"
                            />
                            <p className="text-xs text-gray-500">
                              Add a promotional image that will appear below your signature
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="promotional-link" className="text-sm">Promotional Link</Label>
                            <Input
                              id="promotional-link"
                              {...form.register("promotionalLink")}
                              placeholder="https://company.com/promotion"
                              className="text-sm"
                            />
                            <p className="text-xs text-gray-500">
                              Make the promotional image clickable (optional)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}