import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, mockProducts, categories, sortOptions, priceFilters } from '../data/products/mockData';

interface ProductsContextType {
  // Data
  products: Product[];
  categories: typeof categories;
  sortOptions: typeof sortOptions;
  priceFilters: typeof priceFilters;
  
  // Filters
  selectedCategory: string;
  selectedSort: string;
  selectedPriceFilter: string;
  searchQuery: string;
  
  // State
  loading: boolean;
  filteredProducts: Product[];
  
  // Actions
  setSelectedCategory: (category: string) => void;
  setSelectedSort: (sort: string) => void;
  setSelectedPriceFilter: (priceFilter: string) => void;
  setSearchQuery: (query: string) => void;
  toggleProductLike: (productId: string) => void;
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

interface ProductsProviderProps {
  children: ReactNode;
}

export function ProductsProvider({ children }: ProductsProviderProps) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let result = [...products];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.author.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply price filter
    switch (selectedPriceFilter) {
      case 'free':
        result = result.filter(product => product.price === 0);
        break;
      case 'paid':
        result = result.filter(product => product.price > 0);
        break;
      case 'under-25':
        result = result.filter(product => product.price <= 25);
        break;
      case 'under-50':
        result = result.filter(product => product.price <= 50);
        break;
      case 'under-100':
        result = result.filter(product => product.price <= 100);
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Apply sorting
    switch (selectedSort) {
      case 'featured':
        result.sort((a, b) => {
          // Featured items first, then by rating
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        });
        break;
      case 'downloads':
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, selectedSort, selectedPriceFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSort, selectedPriceFilter, searchQuery]);

  const toggleProductLike = (productId: string) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, isLiked: !product.isLiked }
          : product
      )
    );
  };

  const value: ProductsContextType = {
    // Data
    products,
    categories,
    sortOptions,
    priceFilters,
    
    // Filters
    selectedCategory,
    selectedSort,
    selectedPriceFilter,
    searchQuery,
    
    // State
    loading,
    filteredProducts,
    
    // Actions
    setSelectedCategory,
    setSelectedSort,
    setSelectedPriceFilter,
    setSearchQuery,
    toggleProductLike,
    
    // Pagination
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}