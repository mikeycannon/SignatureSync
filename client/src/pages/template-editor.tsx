import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { SignatureEditor } from "@/components/signature-editor";

export default function TemplateEditor() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Signature Editor" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <SignatureEditor onSave={() => {}} onCancel={() => {}} />
        </main>
      </div>
    </div>
  );
}