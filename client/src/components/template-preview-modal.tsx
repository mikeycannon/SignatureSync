import { X, Edit, Copy, Trash2, Linkedin, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type SignatureTemplate } from "@shared/schema";

interface TemplatePreviewModalProps {
  template: SignatureTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (template: SignatureTemplate) => void;
  onDuplicate: (template: SignatureTemplate) => void;
  onDelete: (template: SignatureTemplate) => void;
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Preview - {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Preview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <Card className="p-4 bg-white">
              {/* Sample email context */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="text-sm text-gray-500 mb-2">
                  <strong>To:</strong> client@example.com
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <strong>Subject:</strong> Project Update
                </div>
                <div className="text-gray-400 text-sm leading-relaxed">
                  <p className="mb-3">Hi there,</p>
                  <p className="mb-3">Thanks for the feedback on the latest designs. I've incorporated all your suggestions and the team is excited to move forward with the implementation.</p>
                  <p className="mb-4">Looking forward to hearing from you soon!</p>
                  <p className="mb-4 text-gray-500">Best regards,</p>
                </div>
              </div>
              
              {/* Actual template preview using saved HTML content */}
              <div 
                dangerouslySetInnerHTML={{ __html: template.htmlContent || '' }}
                className="signature-preview"
              />
            </Card>
          </div>

          {/* Template Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                {template.status}
              </Badge>
              {template.isShared && (
                <Badge variant="outline">Shared</Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(template.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button onClick={() => onEdit(template)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
            </Button>
            <Button variant="outline" onClick={() => onDuplicate(template)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => onDelete(template)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
