import { apiClient } from './api';

export interface UploadImageResponse {
  imageUrl: string;
  message: string;
}

export interface UploadFileResponse {
  file: {
    filename: string;
    url: string;
    size: number;
  };
  message: string;
}

export const uploadApi = {
  // Upload image file
  async uploadImage(imageFile: File): Promise<UploadImageResponse> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      throw new Error('Image file size must be less than 20MB');
    }

    // Check if user is authenticated
    const token = localStorage.getItem('auth-token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await apiClient.request<UploadImageResponse>('/upload/image', {
        method: 'POST',
        body: formData
        // Let apiClient handle Authorization header automatically
      });
      return response;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  },

  // Upload product file (single ZIP file only)
  async uploadProductFile(productId: string, file: File): Promise<UploadFileResponse> {
    if (!productId) {
      throw new Error('Product ID is required for file upload');
    }

    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Check if user is authenticated
    const token = localStorage.getItem('auth-token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Validate file type (only ZIP files allowed)
    const allowedTypes = ['application/zip', 'application/x-zip-compressed'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.zip')) {
      throw new Error(`Only ZIP files are allowed. "${file.name}" is not a valid ZIP file.`);
    }

    // Validate file size (max 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" is too large. Maximum size is 200MB.`);
    }

    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('file', file);

    try {
      const response = await apiClient.request<UploadFileResponse>('/upload/product-files', {
        method: 'POST',
        body: formData
        // Let apiClient handle Authorization header automatically
      });
      return response;
    } catch (error: any) {
      console.error('Product file upload failed:', error);
      throw new Error(error.message || 'Failed to upload product file');
    }
  }
};