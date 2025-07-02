import { Link, useLocation } from "wouter";
import { 
  FileSignature, 
  LayoutDashboard, 
  Users, 
  Upload, 
  BarChart3, 
  Settings,
  ChevronRight,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Templates", href: "/templates", icon: FileSignature },
  { name: "Team", href: "/team", icon: Users },
  { name: "Assets", href: "/assets", icon: Upload },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, tenant, logout } = useAuth();

  if (!user || !tenant) {
    return null;
  }

  return (
    <div className={`
      flex flex-shrink-0 z-50
      ${isOpen ? 'fixed inset-y-0 left-0 md:relative' : 'hidden md:flex'}
    `}>
      <div className="flex flex-col w-20 bg-gray-900 min-h-full">
        {/* Logo */}
        <div className="flex items-center justify-center flex-shrink-0 py-4">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
            <FileSignature className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={`
                    flex flex-col items-center p-3 rounded-lg group cursor-pointer transition-colors w-16
                    ${isActive 
                      ? "text-white bg-primary-600" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }
                  `}
                  onClick={() => onClose?.()}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-2 h-auto hover:bg-gray-800 rounded-lg">
                <div className="flex flex-col items-center">
                  <Avatar className="w-8 h-8 mb-1">
                    <AvatarFallback className="text-xs bg-primary-600 text-white">
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-400">Me</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56 ml-2">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">{tenant.name}</p>
              </div>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <span className="mr-2 h-4 w-4">🚪</span>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
