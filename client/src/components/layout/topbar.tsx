import { Bell, Plus, Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface TopBarProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function TopBar({ title, onMobileMenuToggle }: TopBarProps) {
  const { user, tenant, logout } = useAuth();

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
        
        <div></div>
      </div>
    </header>
  );
}
