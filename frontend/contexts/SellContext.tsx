import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { productApi } from '../services/productApi';
import type { Product } from '../types/product';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  tags: string[];
  imageFile: File | null;
  productFiles: File[];
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
  products: Product[];
  stats: SellerStats;
  loading: boolean;
  updateFormData: (field: string, value: string | File | File[] | string[]) => void;
  uploadProduct: () => Promise<void>;
  updateProduct: () => Promise<void>;
  resetForm: () => void;
  setCurrentView: (view: 'dashboard' | 'upload' | 'success' | 'edit') => void;
  editProduct: (id: string) => void;
  deleteProduct: (id: string) => Promise<void>;
  loadProductForEdit: (id: string) => void;
}

const SellContext = createContext<SellContextType | undefined>(undefined);


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
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerData();
  }, []);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      const productsData = await productApi.getProducts();
      setProducts(productsData.products);
      
      const totalProducts = productsData.products.length;
      const totalRevenue = productsData.products.reduce((sum, p) => sum + (p.price * p.downloads), 0);
      const totalSales = productsData.products.reduce((sum, p) => sum + p.downloads, 0);
      const avgRating = productsData.products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts || 0;
      
      setStats({
        totalRevenue,
        totalSales,
        totalProducts,
        avgRating
      });
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | File | File[] | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadProduct = async () => {
    setIsUploading(true);
    
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        tags: formData.tags,
        imageUrl: '',
        author: '',
        version: '1.0.0',
        downloads: 0,
        rating: 0,
        reviews: 0,
        isPremium: false,
        isActive: true,
        sellerId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const newProduct = await productApi.createProduct(productData);
      setProducts(prev => [newProduct, ...prev]);
      setStats(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }));
      
      setIsUploaded(true);
      setCurrentView('success');
    } catch (error) {
      console.error('Failed to upload product:', error);
    } finally {
      setIsUploading(false);
    }
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
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        tags: formData.tags
      };
      
      const updatedProduct = await productApi.updateProduct(editingProductId, updateData);
      
      setProducts(prev => prev.map(product => 
        product.id === editingProductId ? updatedProduct : product
      ));
      
      setEditingProductId(null);
      setCurrentView('dashboard');
      resetForm();
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const loadProductForEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setFormData({
        title: product.title,
        description: product.description || '',
        price: product.price.toString(),
        category: product.category,
        tags: product.tags || [],
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

  const deleteProduct = async (id: string) => {
    try {
      await productApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, totalProducts: prev.totalProducts - 1 }));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
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
      loadProductForEdit,
      loading
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