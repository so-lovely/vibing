import { Badge } from "./ui/badge";
import { useProducts } from "../contexts/ProductsContext";
import { 
  Code, 
  Globe, 
  Terminal, 
  Palette, 
  Database, 
  Shield, 
  Smartphone,
  Bot,
  Package,
  Users,
  LayoutGrid
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  'all': LayoutGrid,
  'libraries': Code,
  'websites': Globe,
  'cli': Terminal,
  'design': Palette,
  'database': Database,
  'security': Shield,
  'mobile': Smartphone,
  'ai': Bot,
  'packages': Package,
  'freelance': Users
};

export function CategorySidebar() {
  const { categories, selectedCategory, setSelectedCategory } = useProducts();

  return (
    <aside className="w-80 p-6 bg-card border-r">
      <div className="sticky top-24">
        <h2 className="text-lg font-semibold mb-4">카테고리</h2>
        
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id] || Code;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${
                    isSelected 
                      ? 'text-primary-foreground' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                  <span className="text-left">{category.name}</span>
                </div>
                <Badge 
                  variant={isSelected ? "secondary" : "secondary"} 
                  className={`text-xs ${
                    isSelected 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : ''
                  }`}
                >
                  {category.count}
                </Badge>
              </button>
            );
          })}
        </div>
        
      </div>
    </aside>
  );
}