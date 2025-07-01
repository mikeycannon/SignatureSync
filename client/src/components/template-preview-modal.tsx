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
              {/* Sample signature preview */}
              <div className="flex items-start space-x-4">
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
                  alt="Company logo"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">John Doe</h3>
                  <p className="text-sm text-gray-600">Senior Marketing Manager</p>
                  <p className="text-sm text-gray-600">Acme Corporation</p>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500 flex items-center">
                      <span className="mr-2">📧</span>
                      john.doe@acme.com
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <span className="mr-2">📞</span>
                      (555) 123-4567
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <span className="mr-2">🌐</span>
                      www.acme.com
                    </p>
                  </div>
                  
                  <div className="mt-3 flex space-x-3">
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <Twitter className="h-4 w-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <Instagram className="h-4 w-4 text-pink-600" />
                    </Button>
                  </div>
                </div>
              </div>
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
