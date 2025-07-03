import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Upload, 
  Search, 
  Image, 
  File, 
  Trash2, 
  Download,
  Copy,
  AlertCircle,
  FileImage,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Asset } from "@shared/schema";

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const uploadAssetMutation = useMutation({
    mutationFn: async (file: File) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Asset uploaded",
        description: "Your asset has been uploaded successfully.",
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadError("");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to upload asset";
      setUploadError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please select a valid image file (JPEG, PNG, GIF, or SVG)');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    uploadAssetMutation.mutate(selectedFile);
  };

  const handleCopyUrl = (asset: Asset) => {
    navigator.clipboard.writeText(asset.url);
    toast({
      title: "URL copied",
      description: "Asset URL has been copied to clipboard.",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const filteredAssets = (assets || []).filter((asset: Asset) => {
    return asset.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        <TopBar title="Asset Library" onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Asset Library</h2>
                  <p className="text-sm text-gray-600">
                    Manage your images, logos, and other assets for signature templates
                  </p>
                </div>
                
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Asset
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload Asset</DialogTitle>
                      <DialogDescription>
                        Upload images, logos, or other assets to use in your signature templates.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {uploadError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-900">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, GIF, SVG up to 5MB
                            </p>
                          </div>
                        </div>
                        
                        {selectedFile && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(selectedFile.type)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsUploadDialogOpen(false);
                          setSelectedFile(null);
                          setUploadError("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpload} 
                        disabled={!selectedFile || uploadAssetMutation.isPending}
                      >
                        {uploadAssetMutation.isPending ? "Uploading..." : "Upload"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Assets Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-32 w-full rounded mb-4" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search criteria.
                    </p>
                  </>
                ) : (
                  <>
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assets yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by uploading your first asset.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setIsUploadDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Asset
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAssets.map((asset: Asset) => (
                  <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {/* Asset Preview */}
                      <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {asset.mimeType.startsWith('image/') ? (
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement?.appendChild(
                                Object.assign(document.createElement('div'), {
                                  className: 'flex items-center justify-center w-full h-full',
                                  innerHTML: `<div class="text-gray-400"><svg class="h-12 w-12" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>`
                                })
                              );
                            }}
                          />
                        ) : (
                          <File className="h-12 w-12 text-gray-400" />
                        )}
                      </div>

                      {/* Asset Info */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate" title={asset.name}>
                          {asset.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatFileSize(asset.size)}</span>
                          <Badge variant="outline" className="text-xs">
                            {asset.mimeType.split('/')[1].toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyUrl(asset)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(asset.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
