'use client';

import UnifiedProductPage from './UnifiedProductPage';

interface ProductCreationFormProps {
  userRole: 'admin' | 'vendor';
  isViewMode?: boolean;
  initialData?: any;
  productId?: string;
}

export default function ProductCreationForm({ 
  userRole,
  isViewMode,
  initialData,
  productId 
}: ProductCreationFormProps) {
  // The UnifiedProductPage component handles view mode detection from URL
  // and doesn't need the additional props for basic functionality
  return <UnifiedProductPage userRole={userRole} />;
}