import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { SignatureEditor } from "@/components/signature-editor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TemplateEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  type SignatureSaveData = {
    htmlContent: string;
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
  };

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: SignatureSaveData) => {
      const { htmlContent, ...content } = data;
      const templateData = {
        name: content.name || "Untitled Signature",
        status: "draft",
        isShared: false,
        content,
        htmlContent,
      };
      return await apiRequest("POST", "/api/templates", templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template saved", description: "Your signature template has been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save template", variant: "destructive" });
    },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Signature Editor" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <SignatureEditor
            onSave={(data) => saveTemplateMutation.mutate(data)}
            onCancel={() => {}}
          />
        </main>
      </div>
    </div>
  );
}