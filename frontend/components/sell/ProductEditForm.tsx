import { Edit, Image, FileText, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { categories } from '../../constants/products';

interface ProductEditFormProps {
  formData: {
    title: string;
    description: string;
    price: string;
    category: string;
    tags: string[];
    imageFile: File | null;
    productFiles: File[];
  };
  onInputChange: (field: string, value: string | File | File[] | string[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function ProductEditForm({ 
  formData, 
  onInputChange, 
  onSubmit, 
  onCancel,
  isEditing 
}: ProductEditFormProps) {
  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      onInputChange('tags', [...formData.tags, tag.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    onInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (!files) return;
    
    if (field === 'imageFile') {
      onInputChange(field, files[0]);
    } else if (field === 'productFiles') {
      onInputChange(field, Array.from(files));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit className="w-5 h-5" />
          <span>Edit Product</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                placeholder="Enter product title"
              />
            </div>

            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => onInputChange('price', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => onInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat.id !== 'all').map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="space-y-2">
                <Input
                  id="tags"
                  placeholder="Add tags (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleTagRemove(tag)}>
                      <Tag className="w-3 h-3 mr-1" />
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="image">Product Image</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('imageFile', e.target.files)}
                  className="hidden"
                />
                <Label htmlFor="image" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Change Image</span>
                  </Button>
                </Label>
                {formData.imageFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.imageFile.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Leave empty to keep current image
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="files">Product Files</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload('productFiles', e.target.files)}
                  className="hidden"
                />
                <Label htmlFor="files" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Update Files</span>
                  </Button>
                </Label>
                {formData.productFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {formData.productFiles.map(file => (
                      <p key={file.name}>{file.name}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Leave empty to keep current files
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Describe your product..."
            rows={4}
          />
        </div>

        <div className="flex space-x-4">
          <Button 
            className="flex-1" 
            size="lg"
            onClick={onSubmit}
            disabled={isEditing || !formData.title || !formData.category}
          >
            {isEditing ? 'Updating...' : 'Update Product'}
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={isEditing}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}