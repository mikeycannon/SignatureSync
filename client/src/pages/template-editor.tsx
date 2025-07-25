import { useState, useEffect, useRef } from "react";
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
const templateFormSchema = insertSignatureTemplateSchema.omit({
  content: true,
  htmlContent: true,
}).extend({
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

// Generate HTML content with custom styles
function generateHtmlWithCustomStyles(data: TemplateFormData, styles: any): string {
  const { fullName, jobTitle, company, email, phone, website, linkedIn, twitter, instagram, logoUrl, promotionalImage, promotionalLink } = data;
  
  let html = '<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">';
  
  // Main signature content
  html += '<div style="display: flex; align-items: flex-start;">';
  
  // Logo section
  if (logoUrl) {
    html += `<div style="padding-right: ${styles.logoSpacing}px;"><img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px; border-radius: ${styles.logoRadius}px;" /></div>`;
  }
  
  // Text content
  html += '<div>';
  if (fullName) html += `<div style="font-size: ${styles.nameSize}px; font-weight: ${styles.nameWeight}; color: ${styles.nameColor}; font-family: ${styles.nameFont}; margin-bottom: 4px;">${fullName}</div>`;
  if (jobTitle) html += `<div style="font-size: ${styles.roleSize}px; font-weight: ${styles.roleWeight}; color: ${styles.roleColor}; font-family: ${styles.roleFont}; margin-bottom: 4px;">${jobTitle}</div>`;
  if (company) html += `<div style="font-size: ${styles.companySize}px; font-weight: ${styles.companyWeight}; color: ${styles.companyColor}; font-family: ${styles.companyFont}; margin-bottom: 8px;">${company}</div>`;
  
  // Contact info
  const contacts = [];
  if (email) contacts.push(`📧 <a href="mailto:${email}" style="color: ${styles.linkColor}; text-decoration: none;">${email}</a>`);
  if (phone) contacts.push(`📞 <a href="tel:${phone}" style="color: ${styles.linkColor}; text-decoration: none;">${phone}</a>`);
  if (website) contacts.push(`🌐 <a href="${website}" style="color: ${styles.linkColor}; text-decoration: none;">${website}</a>`);
  
  if (contacts.length > 0) {
    html += `<div style="font-size: ${styles.contactSize}px; font-weight: ${styles.contactWeight}; color: ${styles.contactColor}; font-family: ${styles.contactFont}; margin-bottom: 8px;">${contacts.join('<br>')}</div>`;
  }
  
  // Social links
  const socials = [];
  if (linkedIn) socials.push(`<a href="${linkedIn}" style="color: ${styles.linkColor}; text-decoration: none;">LinkedIn</a>`);
  if (twitter) socials.push(`<a href="${twitter}" style="color: ${styles.linkColor}; text-decoration: none;">Twitter</a>`);
  if (instagram) socials.push(`<a href="${instagram}" style="color: ${styles.linkColor}; text-decoration: none;">Instagram</a>`);
  
  if (socials.length > 0) {
    html += `<div style="font-size: ${styles.contactSize}px; font-weight: ${styles.contactWeight}; color: ${styles.contactColor}; font-family: ${styles.contactFont};">${socials.join(' | ')}</div>`;
  }
  
  html += '</div>'; // Close text content div
  html += '</div>'; // Close main flex div
  
  // Promotional image
  if (promotionalImage) {
    if (promotionalLink) {
      html += `<div style="margin-top: 15px;"><a href="${promotionalLink}" target="_blank"><img src="${promotionalImage}" alt="Promotional Banner" style="max-width: 100%; height: ${styles.promoHeight}px; object-fit: cover;" /></a></div>`;
    } else {
      html += `<div style="margin-top: 15px;"><img src="${promotionalImage}" alt="Promotional Banner" style="max-width: 100%; height: ${styles.promoHeight}px; object-fit: cover;" /></div>`;
    }
  }
  
  html += '</div>';
  return html;
}

// Function to generate HTML content from form data
function generateHtmlFromFormData(data: TemplateFormData): string {
  const { fullName, jobTitle, company, email, phone, website, linkedIn, twitter, instagram, logoUrl, promotionalImage, promotionalLink } = data;
  
  let html = '<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">';
  
  // Main signature content
  html += '<div style="display: flex; align-items: flex-start;">';
  
  // Logo section
  if (logoUrl) {
    html += `<div style="padding-right: 20px;"><img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px; border-radius: 0px;" /></div>`;
  }
  
  // Text content
  html += '<div>';
  if (fullName) html += `<div style="font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 4px;">${fullName}</div>`;
  if (jobTitle) html += `<div style="font-size: 14px; color: #666; margin-bottom: 4px;">${jobTitle}</div>`;
  if (company) html += `<div style="font-size: 14px; color: #666; margin-bottom: 8px;">${company}</div>`;
  
  // Contact info
  const contacts = [];
  if (email) contacts.push(`<a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>`);
  if (phone) contacts.push(`<a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>`);
  if (website) contacts.push(`<a href="${website}" style="color: #2563eb; text-decoration: none;">${website}</a>`);
  
  if (contacts.length > 0) {
    html += `<div style="font-size: 13px; margin-bottom: 8px;">${contacts.join(' | ')}</div>`;
  }
  
  // Social links
  const socials = [];
  if (linkedIn) socials.push(`<a href="${linkedIn}" style="color: #2563eb; text-decoration: none;">LinkedIn</a>`);
  if (twitter) socials.push(`<a href="${twitter}" style="color: #2563eb; text-decoration: none;">Twitter</a>`);
  if (instagram) socials.push(`<a href="${instagram}" style="color: #2563eb; text-decoration: none;">Instagram</a>`);
  
  if (socials.length > 0) {
    html += `<div style="font-size: 13px;">${socials.join(' | ')}</div>`;
  }
  
  html += '</div></div>';
  
  // Promotional image
  if (promotionalImage) {
    const imageTag = `<img src="${promotionalImage}" alt="Promotion" style="max-width: 100%; height: auto; margin-top: 16px;" />`;
    html += promotionalLink ? `<a href="${promotionalLink}">${imageTag}</a>` : imageTag;
  }
  
  html += '</div>';
  return html;
}

export default function TemplateEditor({ templateId }: TemplateEditorProps) {
  const [, setLocation] = useLocation();
  const [previewFormat, setPreviewFormat] = useState<"desktop" | "mobile">("desktop");
  const [customStyles, setCustomStyles] = useState({
    nameSize: 18,
    nameColor: "#2563eb",
    nameFont: "Arial",
    nameWeight: "600",
    roleSize: 14,
    roleColor: "#666666",
    roleFont: "Arial",
    roleWeight: "400",
    companySize: 14,
    companyColor: "#666666",
    companyFont: "Arial",
    companyWeight: "400",
    contactSize: 13,
    contactColor: "#333333",
    contactFont: "Arial",
    contactWeight: "400",
    linkColor: "#2563eb",
    spacing: 8,
    padding: 0,
    logoRadius: 0,
    logoSpacing: 20,
    promoHeight: 80
  });
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPromo, setUploadingPromo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Font options
  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
    'Trebuchet MS', 'Palatino', 'Garamond', 'Courier New', 'Monaco'
  ];
  
  const fontWeights = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' }
  ];

  const { data: template, isLoading } = useQuery<SignatureTemplate>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId,
  });

  const { data: allTemplates } = useQuery<SignatureTemplate[]>({
    queryKey: ['/api/templates'],
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

  // Generate automatic template name for new templates
  useEffect(() => {
    if (!templateId && allTemplates && form.watch("name") === "") {
      const templateCount = allTemplates.length;
      const newTemplateName = `Signature #${templateCount + 1}`;
      form.setValue("name", newTemplateName);
    }
  }, [allTemplates, templateId, form]);

  // Upload mutations for logo and promo images
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'logo' | 'promo' }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const { type } = variables;
      const assetUrl = data.url;
      
      if (type === 'logo') {
        form.setValue('logoUrl', assetUrl);
        setUploadingLogo(false);
      } else {
        form.setValue('promotionalImage', assetUrl);
        setUploadingPromo(false);
      }
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    },
    onError: (error: any, variables) => {
      const { type } = variables;
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingPromo(false);
      }
      
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  // File upload handlers
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      setUploadingLogo(true);
      uploadImageMutation.mutate({ file, type: 'logo' });
    }
  };

  const handlePromoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      setUploadingPromo(true);
      uploadImageMutation.mutate({ file, type: 'promo' });
    }
  };

  // Apply style defaults when a formatting option is selected
  const applyStyleDefaults = (formatting: string) => {
    if (formatting === 'custom') return; // Keep existing custom styles
    
    const defaultStyles = {
      modern: {
        nameFont: 'Arial', nameSize: 18, nameColor: '#2563eb', nameWeight: '600',
        roleFont: 'Arial', roleSize: 14, roleColor: '#6b7280', roleWeight: '400',
        companyFont: 'Arial', companySize: 14, companyColor: '#6b7280', companyWeight: '400',
        contactFont: 'Arial', contactSize: 13, contactColor: '#374151', contactWeight: '400'
      },
      classic: {
        nameFont: 'Times New Roman', nameSize: 20, nameColor: '#2c3e50', nameWeight: '700',
        roleFont: 'Times New Roman', roleSize: 15, roleColor: '#7f8c8d', roleWeight: '400',
        companyFont: 'Times New Roman', companySize: 15, companyColor: '#7f8c8d', companyWeight: '400',
        contactFont: 'Times New Roman', contactSize: 14, contactColor: '#2c3e50', contactWeight: '400'
      },
      creative: {
        nameFont: 'Arial', nameSize: 22, nameColor: '#e53e3e', nameWeight: '700',
        roleFont: 'Arial', roleSize: 14, roleColor: '#805ad5', roleWeight: '500',
        companyFont: 'Arial', companySize: 14, companyColor: '#38a169', companyWeight: '500',
        contactFont: 'Arial', contactSize: 13, contactColor: '#2d3748', contactWeight: '400'
      },
      minimal: {
        nameFont: 'Helvetica', nameSize: 16, nameColor: '#333333', nameWeight: '400',
        roleFont: 'Helvetica', roleSize: 13, roleColor: '#666666', roleWeight: '400',
        companyFont: 'Helvetica', companySize: 13, companyColor: '#666666', companyWeight: '400',
        contactFont: 'Helvetica', contactSize: 12, contactColor: '#666666', contactWeight: '400'
      },
      corporate: {
        nameFont: 'Calibri', nameSize: 19, nameColor: '#003366', nameWeight: '700',
        roleFont: 'Calibri', roleSize: 14, roleColor: '#0066cc', roleWeight: '600',
        companyFont: 'Calibri', companySize: 15, companyColor: '#003366', companyWeight: '500',
        contactFont: 'Calibri', contactSize: 13, contactColor: '#003366', contactWeight: '400'
      },
      tech: {
        nameFont: 'Monaco', nameSize: 18, nameColor: '#7c3aed', nameWeight: '600',
        roleFont: 'Monaco', roleSize: 14, roleColor: '#059669', roleWeight: '400',
        companyFont: 'Monaco', companySize: 14, companyColor: '#dc2626', companyWeight: '400',
        contactFont: 'Monaco', contactSize: 13, contactColor: '#374151', contactWeight: '400'
      }
    };

    const styleSet = defaultStyles[formatting as keyof typeof defaultStyles];
    if (styleSet) {
      setCustomStyles(prevStyles => ({
        ...prevStyles,
        ...styleSet
      }));
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const url = templateId ? `/api/templates/${templateId}` : '/api/templates';
      const method = templateId ? 'PUT' : 'POST';
      
      // Extract signature content from form data
      const { name, status, isShared, formatting, promotionalImage, promotionalLink, ...signatureFields } = data;
      
      // Structure the template data according to the schema
      const templateData = {
        name,
        status,
        isShared,
        formatting,
        promotionalImage,
        promotionalLink,
        content: signatureFields, // Store signature fields in content JSON
        htmlContent: generateHtmlFromFormData(data), // Generate HTML preview
      };
      
      return apiRequest(method, url, templateData);
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
      const content = (template.content as any) || {};
      form.reset({
        name: template.name,
        status: template.status as "draft" | "active" | "archived",
        isShared: template.isShared,
        formatting: template.formatting,
        promotionalImage: template.promotionalImage || "",
        promotionalLink: template.promotionalLink || "",
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
  }, [template, form]);

  const handleSave = (data: TemplateFormData) => {
    console.log("Form data being saved:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Check if fullName is empty and provide a default
    if (!data.fullName || data.fullName.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please enter a full name for the signature.",
        variant: "destructive"
      });
      return;
    }
    
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
                paddingRight: customStyles.logoSpacing + 'px', 
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
                fontFamily: customStyles.nameFont,
                fontWeight: customStyles.nameWeight, 
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
                  fontFamily: customStyles.roleFont,
                  fontWeight: customStyles.roleWeight,
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
                  fontFamily: customStyles.companyFont,
                  fontWeight: customStyles.companyWeight,
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
                <div style={{ 
                  fontSize: customStyles.contactSize + 'px', 
                  fontFamily: customStyles.contactFont,
                  fontWeight: customStyles.contactWeight,
                  color: customStyles.contactColor, 
                  marginBottom: '2px' 
                }}>
                  📧 <span style={{ color: customStyles.linkColor }}>{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div style={{ 
                  fontSize: customStyles.contactSize + 'px', 
                  fontFamily: customStyles.contactFont,
                  fontWeight: customStyles.contactWeight,
                  color: customStyles.contactColor, 
                  marginBottom: '2px' 
                }}>
                  📞 {data.phone}
                </div>
              )}
              {data.website && (
                <div style={{ 
                  fontSize: customStyles.contactSize + 'px', 
                  fontFamily: customStyles.contactFont,
                  fontWeight: customStyles.contactWeight,
                  color: customStyles.contactColor, 
                  marginBottom: '2px' 
                }}>
                  🌐 <span style={{ color: customStyles.linkColor }}>{data.website}</span>
                </div>
              )}
              {(data.linkedIn || data.twitter || data.instagram) && (
                <div style={{ 
                  fontSize: customStyles.contactSize + 'px', 
                  fontFamily: customStyles.contactFont,
                  fontWeight: customStyles.contactWeight,
                  color: customStyles.contactColor, 
                  marginTop: '4px' 
                }}>
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
          name: `font-size: ${customStyles.nameSize}px; font-family: ${customStyles.nameFont}; font-weight: ${customStyles.nameWeight}; color: ${customStyles.nameColor}; margin-bottom: ${customStyles.spacing}px;`,
          role: `font-size: ${customStyles.roleSize}px; font-family: ${customStyles.roleFont}; font-weight: ${customStyles.roleWeight}; color: ${customStyles.roleColor}; margin-bottom: ${customStyles.spacing * 0.5}px;`,
          company: `font-size: ${customStyles.companySize}px; font-family: ${customStyles.companyFont}; font-weight: ${customStyles.companyWeight}; color: ${customStyles.companyColor}; margin-bottom: ${customStyles.spacing}px;`,
          contact: `font-size: ${customStyles.contactSize}px; font-family: ${customStyles.contactFont}; font-weight: ${customStyles.contactWeight}; color: ${customStyles.contactColor};`,
          link: `color: ${customStyles.linkColor}; text-decoration: none;`,
          social: `margin-top: ${customStyles.spacing}px; font-size: ${customStyles.contactSize}px; font-family: ${customStyles.contactFont}; font-weight: ${customStyles.contactWeight};`,
          logo: `height: 80px; max-width: 200px; object-fit: contain; border-radius: ${customStyles.logoRadius}px;`,
          promo: `max-width: 100%; height: ${customStyles.promoHeight}px; object-fit: cover; border: none;`
        }
      };
      return styles[formatting as keyof typeof styles] || styles.modern;
    };

    const styles = getFormattingStyles(data.formatting || "modern");

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
              <div>
                <Label className="text-xs text-blue-700">Font Family</Label>
                <Select 
                  value={
                    editingElement === 'name' ? customStyles.nameFont :
                    editingElement === 'role' ? customStyles.roleFont :
                    editingElement === 'company' ? customStyles.companyFont :
                    editingElement === 'contact' ? customStyles.contactFont : 'Arial'
                  } 
                  onValueChange={(value) => {
                    if (editingElement === 'name') setCustomStyles({...customStyles, nameFont: value});
                    else if (editingElement === 'role') setCustomStyles({...customStyles, roleFont: value});
                    else if (editingElement === 'company') setCustomStyles({...customStyles, companyFont: value});
                    else if (editingElement === 'contact') setCustomStyles({...customStyles, contactFont: value});
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-blue-700">Font Weight</Label>
                <Select 
                  value={
                    editingElement === 'name' ? customStyles.nameWeight :
                    editingElement === 'role' ? customStyles.roleWeight :
                    editingElement === 'company' ? customStyles.companyWeight :
                    editingElement === 'contact' ? customStyles.contactWeight : '400'
                  } 
                  onValueChange={(value) => {
                    if (editingElement === 'name') setCustomStyles({...customStyles, nameWeight: value});
                    else if (editingElement === 'role') setCustomStyles({...customStyles, roleWeight: value});
                    else if (editingElement === 'company') setCustomStyles({...customStyles, companyWeight: value});
                    else if (editingElement === 'contact') setCustomStyles({...customStyles, contactWeight: value});
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontWeights.map((weight) => (
                      <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {/* Logo/Image Controls */}
          {editingElement === 'logo' && (
            <>
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
              <div>
                <Label className="text-xs text-blue-700">Spacing: {customStyles.logoSpacing}px</Label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={customStyles.logoSpacing}
                  onChange={(e) => setCustomStyles({...customStyles, logoSpacing: parseInt(e.target.value)})}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
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
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={templateId ? "Edit Template" : "Create Template"} onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button variant="ghost" onClick={handleCancel} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
              
              {/* Desktop: Title and buttons on same row, Mobile: Title on top, buttons below */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <Input
                    id="template-name"
                    {...form.register("name")}
                    placeholder="Signature #1"
                    className="text-2xl lg:text-3xl font-bold text-gray-900 border-none bg-transparent p-0 shadow-none focus:border focus:bg-white focus:shadow-sm focus:p-3 focus:rounded-md transition-all"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                {/* Status and Save buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:flex-shrink-0">
                  <Select value={form.watch("status")} onValueChange={(value: "draft" | "active" | "archived") => form.setValue("status", value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    type="button"
                    disabled={mutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    onClick={() => {
                      console.log("Save button clicked");
                      console.log("Form values:", form.getValues());
                      console.log("Form errors:", form.formState.errors);
                      form.handleSubmit(handleSave)();
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {templateId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Layout: Preview (6/12) + Editor (6/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Preview (6/12 width) */}
              <div className="lg:col-span-6">
                <div className="sticky top-6">
                  <Card>
                    <CardHeader>
                      <div className="space-y-4">
                        <CardTitle>Live Preview</CardTitle>
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 w-full sm:w-fit">
                          <Button
                            type="button"
                            variant={previewFormat === "desktop" ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-3 flex-1"
                            onClick={() => setPreviewFormat("desktop")}
                          >
                            <Monitor className="h-4 w-4 mr-1" />
                            Desktop
                          </Button>
                          <Button
                            type="button"
                            variant={previewFormat === "mobile" ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-3 flex-1"
                            onClick={() => setPreviewFormat("mobile")}
                          >
                            <Smartphone className="h-4 w-4 mr-1" />
                            Mobile
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  <CardContent>
                    <div className={`signature-preview bg-white border rounded p-4 min-h-40 ${
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
                          onClick={() => {
                            form.setValue("formatting", option.value);
                            applyStyleDefaults(option.value);
                          }}
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
              </div>

              {/* Right Column - Signature Editor (6/12 width) */}
              <div className="lg:col-span-6">
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
                        <div className="grid grid-cols-2 gap-3">
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
                          <div className="space-y-2 col-span-2">
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
                        <div className="grid grid-cols-2 gap-3">
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
                          <div className="space-y-2 col-span-2">
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
                        <div className="grid grid-cols-2 gap-3">
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
                          <div className="space-y-2 col-span-2">
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 col-span-2">
                            <Label className="text-sm">Company Logo</Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => logoFileInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="flex-1"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploadingLogo ? "Uploading..." : form.watch("logoUrl") ? "Change Logo" : "Upload Logo"}
                              </Button>
                              {form.watch("logoUrl") && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => form.setValue("logoUrl", "")}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <input
                              ref={logoFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            {form.watch("logoUrl") && (
                              <div className="mt-2">
                                <img 
                                  src={form.watch("logoUrl")} 
                                  alt="Logo preview" 
                                  className="h-16 object-contain border rounded"
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Promo Image</Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => promoFileInputRef.current?.click()}
                                disabled={uploadingPromo}
                                className="flex-1"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploadingPromo ? "Uploading..." : form.watch("promotionalImage") ? "Change Image" : "Upload Image"}
                              </Button>
                              {form.watch("promotionalImage") && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => form.setValue("promotionalImage", "")}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <input
                              ref={promoFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePromoUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500">
                              Add a promo image that will appear below your signature
                            </p>
                            {form.watch("promotionalImage") && (
                              <div className="mt-2">
                                <img 
                                  src={form.watch("promotionalImage")} 
                                  alt="Promo preview" 
                                  className="h-16 object-contain border rounded"
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="promotional-link" className="text-sm">Promo Link</Label>
                            <Input
                              id="promotional-link"
                              {...form.register("promotionalLink")}
                              placeholder="https://company.com/promotion"
                              className="text-sm"
                            />
                            <p className="text-xs text-gray-500">
                              Make the promo image clickable (optional)
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