import { Plus, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProductUploadForm } from '../components/sell/ProductUploadForm';
import { ProductEditForm } from '../components/sell/ProductEditForm';
import { SellerDashboard } from '../components/sell/SellerDashboard';
import { UploadSuccess } from '../components/sell/UploadSuccess';
import { SellProvider, useSell } from '../contexts/SellContext';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

function SellPageContent() {
  const { user } = useAuth();
  const {
    currentView,
    formData,
    isUploading,
    isUploaded,
    isEditing,
    products,
    stats,
    updateFormData,
    uploadProduct,
    updateProduct,
    resetForm,
    setCurrentView,
    editProduct,
    deleteProduct
  } = useSell();

  const handleUploadAnother = () => {
    resetForm();
    setCurrentView('upload');
  };

  const handleViewDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleCancelEdit = () => {
    resetForm();
    setCurrentView('dashboard');
  };

  if (currentView === 'success' && isUploaded) {
    return (
      <main className="container mx-auto py-8">
        <UploadSuccess
          productTitle={formData.title}
          onViewDashboard={handleViewDashboard}
          onUploadAnother={handleUploadAnother}
        />
      </main>
    );
  }

  if (currentView === 'edit') {
    return (
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
          <p className="text-muted-foreground">
            Update your product information and settings.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ProductEditForm
            formData={formData}
            onInputChange={updateFormData}
            onSubmit={updateProduct}
            onCancel={handleCancelEdit}
            isEditing={isEditing}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">판매하기</h1>
        <p className="text-muted-foreground">
          개발자 도구와 리소스를 판매하여 수익을 창출하세요.
        </p>
      </div>

      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'dashboard' | 'upload')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Upload Product</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-8">
          <SellerDashboard
            products={products}
            stats={stats}
            onEditProduct={editProduct}
            onDeleteProduct={deleteProduct}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-8">
          <div className="max-w-4xl mx-auto">
            <ProductUploadForm
              formData={formData}
              onInputChange={updateFormData}
              onSubmit={uploadProduct}
              isUploading={isUploading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

export function SellPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <SellProvider>
        <SellPageContent />
      </SellProvider>
    </ProtectedRoute>
  );
}