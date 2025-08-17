import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { useProducts } from "../contexts/ProductsContext";

export function ProductFilters() {
  const {
    searchQuery,
    setSearchQuery,
    selectedSort,
    setSelectedSort,
    selectedPriceFilter,
    setSelectedPriceFilter,
    sortOptions,
    priceFilters,
    products,
    selectedCategory,
    categories,
    totalItems
  } = useProducts();

  const activeCategory = categories.find(cat => cat.id === selectedCategory);
  const hasActiveFilters = selectedPriceFilter !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSelectedPriceFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="제품, 개발자, 태그 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort Select */}
        <div className="flex gap-2">
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                필터
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {[selectedPriceFilter !== 'all' ? '가격' : '', searchQuery.trim() ? '검색' : '']
                      .filter(Boolean).length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">필터</h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      초기화
                    </Button>
                  )}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">가격</label>
                  <Select value={selectedPriceFilter} onValueChange={setSelectedPriceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priceFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results Info and Active Filters */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            {activeCategory?.name}에서 {totalItems.toLocaleString()}개 제품 발견
          </span>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span>·</span>
              <div className="flex gap-1">
                {selectedPriceFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    {priceFilters.find(f => f.value === selectedPriceFilter)?.label}
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="outline" className="text-xs">
                    "{searchQuery.trim()}"
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}