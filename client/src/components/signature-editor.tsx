import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Linkedin, Twitter, Instagram, Globe, Mail, Phone } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Text, Image as ImageIcon, Link, Info, User, Smartphone } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

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

// Block Types
export type BlockType = 'text' | 'image' | 'social' | 'logo' | 'legal' | 'contact';

export interface SignatureBlock {
  id: string;
  type: BlockType;
  data: any;
}

const PALETTE: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text', icon: <Text className="w-4 h-4" /> },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
  { type: 'social', label: 'Social Links', icon: <Link className="w-4 h-4" /> },
  { type: 'logo', label: 'Logo', icon: <User className="w-4 h-4" /> },
  { type: 'legal', label: 'Legal', icon: <Info className="w-4 h-4" /> },
  { type: 'contact', label: 'Contact', icon: <Smartphone className="w-4 h-4" /> },
];

const VARIABLE_OPTIONS = [
  { label: 'First Name', value: 'firstName' },
  { label: 'Last Name', value: 'lastName' },
  { label: 'Email', value: 'email' },
  { label: 'Username', value: 'username' },
  { label: 'Title', value: 'title' },
  { label: 'Department', value: 'department' },
  { label: 'Phone', value: 'phone' },
  { label: 'Avatar', value: 'avatar' },
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Helper to render variables in HTML preview
function renderVariables(str: string, user: Record<string, string | undefined>) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, v) => user[v] || '');
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

  const [blocks, setBlocks] = useState<SignatureBlock[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // For preview, mock user data (replace with real user context in integration)
  const mockUser: Record<string, string> = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    username: 'janedoe',
    title: 'Marketing Manager',
    department: 'Marketing',
    phone: '+1 555-123-4567',
    avatar: '',
  };

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

  // Drag from palette to canvas
  const handlePaletteDragStart = (type: BlockType) => {
    const newBlock: SignatureBlock = {
      id: generateId(),
      type,
      data: {},
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  // Drag to reorder
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((b) => b.id === active.id);
        const newIndex = items.findIndex((b) => b.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Update block data helper
  const updateBlockData = (id: string, data: any) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));
  };

  // Generate HTML from blocks
  const generateHtmlFromBlocks = (blocks: SignatureBlock[]): string => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        ${blocks
          .map((block) => {
            // Conditional logic: if block.data.conditionField, only show if user has value
            if (block.data?.conditionField && !mockUser[block.data.conditionField]) return '';
            switch (block.type) {
              case 'text':
                return `<div style=\"margin-bottom:8px;\">${renderVariables(block.data?.html || '', mockUser)}</div>`;
              case 'image':
                return block.data?.url ? `<div style=\"margin-bottom:8px;\"><img src=\"${block.data.url}\" alt=\"Image\" style=\"max-width:100%;height:auto;border-radius:4px;\" /></div>` : '';
              case 'social':
                return `<div style=\"margin-bottom:8px;\">[Social links]</div>`;
              case 'logo':
                return block.data?.url ? `<div style=\"margin-bottom:8px;\"><img src=\"${block.data.url}\" alt=\"Logo\" style=\"max-width:120px;height:auto;border-radius:8px;\" /></div>` : '';
              case 'legal':
                return `<div style=\"margin-bottom:8px; font-size:11px; color:#888;\">[Legal disclaimer]</div>`;
              case 'contact':
                return `<div style=\"margin-bottom:8px;\">${VARIABLE_OPTIONS.filter(v => v.value !== 'avatar').map(v => mockUser[v.value] ? `<div><b>${v.label}:</b> ${mockUser[v.value]}</div>` : '').join('')}</div>`;
              default:
                return '';
            }
          })
          .join('')}
      </div>
    `;
  };

  const htmlPreview = useMemo(() => generateHtmlFromBlocks(blocks), [blocks]);

  // Export HTML as file
  const handleExportHtml = () => {
    const blob = new Blob([htmlPreview], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signature.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-6">
      {/* Sidebar Palette */}
      <aside className="w-full lg:w-64 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PALETTE.map((item) => (
              <Button
                key={item.type}
                variant="outline"
                className="w-full flex items-center gap-2 justify-start"
                onClick={() => handlePaletteDragStart(item.type)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </aside>

      {/* Editor Canvas */}
      <main className="flex-1 min-h-[500px]">
        <Card>
          <CardHeader>
            <CardTitle>Signature Canvas</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {blocks.length === 0 && (
                    <div className="text-gray-400 text-center py-12">
                      Drag elements from the left to start building your signature.
                    </div>
                  )}
                  {blocks.map((block) => (
                    <SignatureBlockRenderer
                      key={block.id}
                      block={block}
                      updateBlockData={updateBlockData}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </main>

      {/* Real-time Preview */}
      <aside className="w-full lg:w-96">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportHtml}>
                Export HTML
              </Button>
            </div>
            <div
              className={
                previewMode === 'mobile'
                  ? 'border rounded bg-white mx-auto w-[375px] min-h-[300px] overflow-auto shadow'
                  : 'border rounded bg-white w-full min-h-[300px] overflow-auto shadow'
              }
              style={{ maxWidth: previewMode === 'mobile' ? 375 : 500 }}
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

// Block Renderer (rich text for text blocks)
function SignatureBlockRenderer({ block, updateBlockData }: { block: SignatureBlock; updateBlockData: (id: string, data: any) => void }) {
  if (block.type === 'text') {
    return <RichTextBlock block={block} updateBlockData={updateBlockData} />;
  }
  if (block.type === 'image' || block.type === 'logo') {
    return <ImageBlock block={block} updateBlockData={updateBlockData} />;
  }
  if (block.type === 'contact') {
    return (
      <div className="border rounded p-3 bg-white">
        <div className="mb-2 text-xs text-gray-500">Contact Info (dynamic):</div>
        <div className="space-y-1">
          {VARIABLE_OPTIONS.filter(v => v.value !== 'avatar').map(v => (
            <div key={v.value} className="flex items-center gap-2">
              <span className="font-medium">{v.label}:</span>
              <span className="text-gray-700">{'{{'+v.value+'}}'}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Show only if:</span>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={block.data?.conditionField || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBlockData(block.id, { ...block.data, conditionField: e.target.value || undefined })}
          >
            <option value="">Always show</option>
            {VARIABLE_OPTIONS.map(v => (
              <option key={v.value} value={v.value}>{v.label} exists</option>
            ))}
          </select>
        </div>
      </div>
    );
  }
  switch (block.type) {
    case 'social':
      return (
        <div className="border rounded p-3 bg-gray-50">Social Links Block</div>
      );
    case 'legal':
      return (
        <div className="border rounded p-3 bg-gray-50">Legal Disclaimer Block</div>
      );
    default:
      return null;
  }
}

// Rich Text Block Component
function RichTextBlock({ block, updateBlockData }: { block: SignatureBlock; updateBlockData: (id: string, data: any) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Type your text...' }),
    ],
    content: block.data?.content || '',
    onUpdate: ({ editor }) => {
      updateBlockData(block.id, {
        ...block.data,
        content: editor.getHTML(),
        html: editor.getHTML(),
      });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm min-h-[60px] focus:outline-none',
      },
    },
  });

  // Insert variable at cursor
  const insertVariable = (variable: string) => {
    if (editor) {
      editor.commands.insertContent(`{{${variable}}}`);
    }
  };

  return (
    <div className="border rounded p-3 bg-white">
      <div className="mb-2 flex flex-wrap gap-2">
        {VARIABLE_OPTIONS.map((v) => (
          <Button key={v.value} size="sm" variant="outline" onClick={() => insertVariable(v.value)}>
            {`{${v.label}}`}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
      {/* Conditional logic UI */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-gray-500">Show only if:</span>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={block.data?.conditionField || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBlockData(block.id, { ...block.data, conditionField: e.target.value || undefined })}
        >
          <option value="">Always show</option>
          {VARIABLE_OPTIONS.map(v => (
            <option key={v.value} value={v.value}>{v.label} exists</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Image/Logo Block Component
function ImageBlock({ block, updateBlockData }: { block: SignatureBlock; updateBlockData: (id: string, data: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setUploading(true);
    setError(null);
    try {
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
      const data = await response.json();
      updateBlockData(block.id, { ...block.data, url: data.url });
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded p-3 bg-white flex flex-col gap-2">
      {block.data?.url ? (
        <div className="flex flex-col items-center gap-2">
          <img src={block.data.url} alt="Uploaded" className="max-h-32 object-contain border rounded" />
          <Button variant="outline" size="sm" onClick={() => updateBlockData(block.id, { ...block.data, url: undefined })}>
            Remove Image
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      )}
    </div>
  );
}
