import { Users, Package, Settings, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'products', label: 'Product Management', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
      </div>
      
      <Separator />
      
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start text-left ${
                isActive 
                  ? 'bg-slate-900 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}