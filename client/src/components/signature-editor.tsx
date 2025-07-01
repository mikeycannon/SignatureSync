import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Linkedin, Twitter, Instagram, Globe, Mail, Phone } from "lucide-react";

interface SignatureData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
  logo?: string;
}

interface SignatureEditorProps {
  initialData?: Partial<SignatureData>;
  onSave: (data: SignatureData & { htmlContent: string }) => void;
  onCancel: () => void;
}

export function SignatureEditor({ initialData, onSave, onCancel }: SignatureEditorProps) {
  const [signatureData, setSignatureData] = useState<SignatureData>({
    name: initialData?.name || "",
    title: initialData?.title || "",
    company: initialData?.company || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    website: initialData?.website || "",
    linkedIn: initialData?.linkedIn || "",
    twitter: initialData?.twitter || "",
    instagram: initialData?.instagram || "",
    logo: initialData?.logo || "",
  });

  const handleInputChange = (field: keyof SignatureData, value: string) => {
    setSignatureData(prev => ({ ...prev, [field]: value }));
  };

  const generateHtmlContent = (): string => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${signatureData.logo ? `
              <td style="padding-right: 20px; vertical-align: top;">
                <img src="${signatureData.logo}" alt="Company Logo" style="width: 80px; height: 80px; border-radius: 8px;">
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <div style="margin-bottom: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 2px;">
                  ${signatureData.name}
                </div>
                <div style="font-size: 14px; color: #666666; margin-bottom: 2px;">
                  ${signatureData.title}
                </div>
                <div style="font-size: 14px; color: #666666;">
                  ${signatureData.company}
                </div>
              </div>
              
              <div style="margin-bottom: 12px;">
                ${signatureData.email ? `
                  <div style="font-size: 13px; color: #888888; margin-bottom: 2px;">
                    📧 ${signatureData.email}
                  </div>
                ` : ''}
                ${signatureData.phone ? `
                  <div style="font-size: 13px; color: #888888; margin-bottom: 2px;">
                    📞 ${signatureData.phone}
                  </div>
                ` : ''}
                ${signatureData.website ? `
                  <div style="font-size: 13px; color: #888888;">
                    🌐 ${signatureData.website}
                  </div>
                ` : ''}
              </div>
              
              <div>
                ${signatureData.linkedIn ? `
                  <a href="${signatureData.linkedIn}" style="text-decoration: none; margin-right: 8px;">
                    <span style="color: #0077B5;">LinkedIn</span>
                  </a>
                ` : ''}
                ${signatureData.twitter ? `
                  <a href="${signatureData.twitter}" style="text-decoration: none; margin-right: 8px;">
                    <span style="color: #1DA1F2;">Twitter</span>
                  </a>
                ` : ''}
                ${signatureData.instagram ? `
                  <a href="${signatureData.instagram}" style="text-decoration: none;">
                    <span style="color: #E4405F;">Instagram</span>
                  </a>
                ` : ''}
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  const handleSave = () => {
    const htmlContent = generateHtmlContent();
    onSave({
      ...signatureData,
      htmlContent,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Signature Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={signatureData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={signatureData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Senior Marketing Manager"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={signatureData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Company Logo URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="logo"
                      value={signatureData.logo}
                      onChange={(e) => handleInputChange("logo", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={signatureData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@acme.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={signatureData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
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
                      value={signatureData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="www.acme.com"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="linkedin"
                      className="pl-10"
                      value={signatureData.linkedIn}
                      onChange={(e) => handleInputChange("linkedIn", e.target.value)}
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
                      value={signatureData.twitter}
                      onChange={(e) => handleInputChange("twitter", e.target.value)}
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
                      value={signatureData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                      placeholder="https://instagram.com/johndoe"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="signature-preview">
              <div className="flex items-start space-x-4">
                {signatureData.logo && (
                  <img
                    src={signatureData.logo}
                    alt="Company logo"
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div>
                  {signatureData.name && (
                    <h3 className="text-lg font-semibold text-gray-900">
                      {signatureData.name}
                    </h3>
                  )}
                  {signatureData.title && (
                    <p className="text-sm text-gray-600">{signatureData.title}</p>
                  )}
                  {signatureData.company && (
                    <p className="text-sm text-gray-600">{signatureData.company}</p>
                  )}
                  
                  <div className="mt-2 space-y-1">
                    {signatureData.email && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="mr-2 h-3 w-3" />
                        {signatureData.email}
                      </p>
                    )}
                    {signatureData.phone && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <Phone className="mr-2 h-3 w-3" />
                        {signatureData.phone}
                      </p>
                    )}
                    {signatureData.website && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <Globe className="mr-2 h-3 w-3" />
                        {signatureData.website}
                      </p>
                    )}
                  </div>
                  
                  {(signatureData.linkedIn || signatureData.twitter || signatureData.instagram) && (
                    <div className="mt-3 flex space-x-3">
                      {signatureData.linkedIn && (
                        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {signatureData.twitter && (
                        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                          <Twitter className="h-4 w-4 text-blue-400" />
                        </Button>
                      )}
                      {signatureData.instagram && (
                        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                          <Instagram className="h-4 w-4 text-pink-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
