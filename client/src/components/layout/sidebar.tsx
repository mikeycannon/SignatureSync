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
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Signature Templates", href: "/templates", icon: FileSignature },
  { name: "Team Members", href: "/team", icon: Users },
  { name: "Asset Library", href: "/assets", icon: Upload },
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
      <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-full">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <FileSignature className="h-4 w-4 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">
              {tenant.name}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg group cursor-pointer transition-colors
                    ${isActive 
                      ? "text-primary-700 bg-primary-50" 
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                  onClick={() => onClose?.()}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-500" : "text-gray-400"}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-0 h-auto hover:bg-gray-50">
                <div className="flex items-center w-full">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
