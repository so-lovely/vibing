import type { Category, SortOption, PriceFilter } from '../types/product';

export const categories: Category[] = [
  { id: 'all', name: 'All Categories', icon: 'Grid3X3', count: 0 },
  { id: 'libraries', name: 'Libraries & Frameworks', icon: 'Package', count: 0 },
  { id: 'cli-tools', name: 'CLI Tools', icon: 'Terminal', count: 0 },
  { id: 'web-templates', name: 'Web Templates', icon: 'Globe', count: 0 },
  { id: 'mobile', name: 'Mobile Apps', icon: 'Smartphone', count: 0 },
  { id: 'desktop', name: 'Desktop Apps', icon: 'Monitor', count: 0 },
  { id: 'design', name: 'Design Assets', icon: 'Palette', count: 0 },
  { id: 'database', name: 'Database Tools', icon: 'Database', count: 0 },
  { id: 'ai-ml', name: 'AI & Machine Learning', icon: 'Brain', count: 0 },
  { id: 'security', name: 'Security Tools', icon: 'Shield', count: 0 },
];

export const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' },
];

export const priceFilters: PriceFilter[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free', min: 0, max: 0 },
  { value: 'under-10', label: 'Under $10', min: 0, max: 10 },
  { value: '10-50', label: '$10 - $50', min: 10, max: 50 },
  { value: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { value: 'over-100', label: 'Over $100', min: 100 },
];