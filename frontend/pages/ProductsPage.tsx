import { CategorySidebar } from "../components/CategorySidebar";
import { ProductGrid } from "../components/ProductGrid";
import { ProductsProvider } from "../contexts/ProductsContext";

export function ProductsPage() {
  return (
    <ProductsProvider>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto">
          <div className="flex">
            {/* Category Sidebar - Hidden on mobile, shown on large screens */}
            <div className="hidden lg:block">
              <CategorySidebar />
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <ProductGrid />
            </div>
          </div>
        </div>
      </main>
    </ProductsProvider>
  );
}