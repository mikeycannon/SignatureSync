import { Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { Link } from "wouter";

interface TopBarProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function TopBar({ title, onMobileMenuToggle }: TopBarProps) {
  const { tenant } = useTenant();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden mr-4"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Tenant Selector - For future multi-tenant switching */}
          <Select defaultValue={tenant?.slug}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={tenant?.slug || "default"}>
                {tenant?.name || "Default Tenant"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* New Template Button */}
          <Link href="/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
