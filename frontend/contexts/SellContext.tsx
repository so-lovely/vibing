import { createContext, useContext, useState, ReactNode } from 'react';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  tags: string[];
  imageFile: File | null;
  productFiles: File[];
}

interface SellerProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  sales: number;
  revenue: number;
  views: number;
  downloads: number;
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
}

interface SellerStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  avgRating: number;
}

interface SellContextType {
  currentView: 'dashboard' | 'upload' | 'success' | 'edit';
  formData: ProductFormData;
  isUploading: boolean;
  isUploaded: boolean;
  isEditing: boolean;
  editingProductId: string | null;
  products: SellerProduct[];
  stats: SellerStats;
  updateFormData: (field: string, value: string | File | File[] | string[]) => void;
  uploadProduct: () => Promise<void>;
  updateProduct: () => Promise<void>;
  resetForm: () => void;
  setCurrentView: (view: 'dashboard' | 'upload' | 'success' | 'edit') => void;
  editProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
  loadProductForEdit: (id: string) => void;
}

const SellContext = createContext<SellContextType | undefined>(undefined);

const mockProducts: SellerProduct[] = [
  {
    id: '1',
    title: 'React Authentication Kit',
    category: 'libraries',
    price: 29.99,
    sales: 156,
    revenue: 4678.44,
    views: 2847,
    downloads: 1567,
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Vue Data Visualization',
    category: 'libraries',
    price: 0,
    sales: 89,
    revenue: 0,
    views: 1543,
    downloads: 1543,
    status: 'active',
    createdAt: '2024-01-20'
  }
];

const mockStats: SellerStats = {
  totalRevenue: 4678.44,
  totalSales: 245,
  totalProducts: 2,
  avgRating: 4.7
};

export function SellProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'success' | 'edit'>('dashboard');
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    tags: [],
    imageFile: null,
    productFiles: [],
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>(mockProducts);
  const [stats, setStats] = useState<SellerStats>(mockStats);

  const updateFormData = (field: string, value: string | File | File[] | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadProduct = async () => {
    setIsUploading(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add new product to list
    const newProduct: SellerProduct = {
      id: Date.now().toString(),
      title: formData.title,
      category: formData.category,
      price: parseFloat(formData.price),
      sales: 0,
      revenue: 0,
      views: 0,
      downloads: 0,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setProducts(prev => [newProduct, ...prev]);
    setStats(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }));
    
    setIsUploading(false);
    setIsUploaded(true);
    setCurrentView('success');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      tags: [],
      imageFile: null,
      productFiles: [],
    });
    setIsUploaded(false);
  };

  const updateProduct = async () => {
    if (!editingProductId) return;
    
    setIsEditing(true);
    
    // Simulate update process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update product in list
    setProducts(prev => prev.map(product => 
      product.id === editingProductId 
        ? {
            ...product,
            title: formData.title,
            category: formData.category,
            price: parseFloat(formData.price)
          }
        : product
    ));
    
    setIsEditing(false);
    setEditingProductId(null);
    setCurrentView('dashboard');
    resetForm();
  };

  const loadProductForEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setFormData({
        title: product.title,
        description: '', // We'll need to expand the mock data to include description
        price: product.price.toString(),
        category: product.category,
        tags: [], // We'll need to expand the mock data to include tags
        imageFile: null,
        productFiles: [],
      });
      setEditingProductId(id);
      setCurrentView('edit');
    }
  };

  const editProduct = (id: string) => {
    loadProductForEdit(id);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setStats(prev => ({ ...prev, totalProducts: prev.totalProducts - 1 }));
  };

  return (
    <SellContext.Provider value={{
      currentView,
      formData,
      isUploading,
      isUploaded,
      isEditing,
      editingProductId,
      products,
      stats,
      updateFormData,
      uploadProduct,
      updateProduct,
      resetForm,
      setCurrentView,
      editProduct,
      deleteProduct,
      loadProductForEdit
    }}>
      {children}
    </SellContext.Provider>
  );
}

export function useSell() {
  const context = useContext(SellContext);
  if (context === undefined) {
    throw new Error('useSell must be used within a SellProvider');
  }
  return context;
}