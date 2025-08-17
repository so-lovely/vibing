import { ProductCard } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";
import { Skeleton } from "./ui/skeleton";
import { useProducts } from "../contexts/ProductsContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

export function ProductGrid() {
  const {
    products,
    loading,
    error,
    currentPage,
    setCurrentPage,
    totalPages,
    toggleLike
  } = useProducts();

  const handleProductLike = (productId: string) => {
    toggleLike(productId);
  };

  if (loading) {
    return (
      <section className="py-6 px-4">
        <div className="space-y-6">
          <ProductFilters />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6 px-4">
        <div className="space-y-6">
          <ProductFilters />
          <div className="text-center py-12">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-red-600">오류가 발생했습니다</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 px-4">
      <div className="space-y-6">
        <ProductFilters />

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
              <p className="text-muted-foreground">
                다른 검색어나 필터를 시도해보세요.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} onClick={() => handleProductLike(product.id)}>
                  <ProductCard {...product} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      const showPage = pageNumber === 1 || 
                                     pageNumber === totalPages || 
                                     Math.abs(pageNumber - currentPage) <= 1;
                      
                      if (!showPage) {
                        if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNumber)}
                            isActive={pageNumber === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}