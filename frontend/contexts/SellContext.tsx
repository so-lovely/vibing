import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { productApi } from '../services/productApi';
import { uploadApi } from '../services/uploadApi';
import { useAuth } from './AuthContext';
import type { Product } from '../types/product';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  tags: string[];
  imageFile: File | null;
  productFile: File | null;
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
  const { user, token } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'success' | 'edit'>('dashboard');
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    tags: [],
    imageFile: null,
    productFile: null,
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
    // Validation checks
    if (!user || !token) {
      console.error('User not authenticated');
      alert('Please log in to upload products');
      return;
    }
    
    if (user.role !== 'seller' && user.role !== 'admin') {
      console.error('User does not have seller permissions');
      alert('Only sellers can upload products');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.description.trim().length < 10) {
      alert('Description must be at least 10 characters');
      return;
    }

    if (parseFloat(formData.price) < 0) {
      alert('Price must be 0 or greater');
      return;
    }

    console.log('Starting upload with user:', { id: user.id, role: user.role, hasToken: !!token });
    setIsUploading(true);
    
    try {
      // First upload image if provided
      let imageUrl = '';
      if (formData.imageFile) {
        console.log('Uploading image...');
        const imageResponse = await uploadApi.uploadImage(formData.imageFile);
        imageUrl = imageResponse.imageUrl;
        console.log('Image uploaded:', imageUrl);
      }

      // Create product with image URL
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        tags: formData.tags,
        imageUrl: imageUrl || ''
      };
      
      console.log('Creating product with data:', productData);
      const newProduct = await productApi.createProduct(productData);
      console.log('Product created:', newProduct);

      // Upload product file if provided
      if (formData.productFile) {
        console.log('Uploading product file...');
        const fileResponse = await uploadApi.uploadProductFile(newProduct.id, formData.productFile);
        console.log('File uploaded:', fileResponse);
      }

      // Reload products to get the latest data
      await loadSellerData();
      
      setIsUploaded(true);
      setCurrentView('success');
      resetForm();
    } catch (error: any) {
      console.error('Failed to upload product:', error);
      const errorMessage = error?.message || 'Failed to upload product. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
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
      productFile: null,
    });
    setIsUploaded(false);
  };

  const updateProduct = async () => {
    if (!editingProductId || !user || !token) return;
    
    // Validation checks
    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.description.trim().length < 10) {
      alert('Description must be at least 10 characters');
      return;
    }

    if (parseFloat(formData.price) < 0) {
      alert('Price must be 0 or greater');
      return;
    }
    
    setIsEditing(true);
    
    try {
      // First upload image if a new one is provided
      let imageUrl = '';
      if (formData.imageFile) {
        console.log('Uploading new image...');
        const imageResponse = await uploadApi.uploadImage(formData.imageFile);
        imageUrl = imageResponse.imageUrl;
        console.log('Image uploaded:', imageUrl);
      }

      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        tags: formData.tags,
        imageUrl: imageUrl // Only include if new image was uploaded
      };
      
      console.log('Updating product with data:', updateData);
      const updatedProduct = await productApi.updateProduct(editingProductId, updateData);
      console.log('Product updated:', updatedProduct);

      // Upload product file if a new one is provided
      if (formData.productFile) {
        console.log('Uploading new product file...');
        const fileResponse = await uploadApi.uploadProductFile(editingProductId, formData.productFile);
        console.log('File uploaded:', fileResponse);
      }
      
      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === editingProductId ? updatedProduct : product
      ));
      
      // Update stats
      await loadSellerData();
      
      setEditingProductId(null);
      setCurrentView('dashboard');
      resetForm();
      
      alert('제품이 성공적으로 수정되었습니다.');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      const errorMessage = error?.message || '제품 수정에 실패했습니다.';
      alert(`수정 실패: ${errorMessage}`);
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
        productFile: null,
      });
      setEditingProductId(id);
      setCurrentView('edit');
    }
  };

  const editProduct = (id: string) => {
    loadProductForEdit(id);
  };

  const deleteProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const confirmDelete = window.confirm(
      `정말로 "${product.title}" 제품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );
    
    if (!confirmDelete) return;

    try {
      await productApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ 
        ...prev, 
        totalProducts: prev.totalProducts - 1,
        totalRevenue: prev.totalRevenue - (product.price * product.downloads),
        totalSales: prev.totalSales - product.downloads
      }));
      
      alert('제품이 성공적으로 삭제되었습니다.');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const errorMessage = error?.message || '제품 삭제에 실패했습니다.';
      alert(`삭제 실패: ${errorMessage}`);
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