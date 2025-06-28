'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Search, AlertTriangle, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

interface HeroBanner {
  banner_id: number;
  title: string;
  subtitle: string;
  description: string;
  background_image: string;
  right_side_image: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminHeroBannersPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    background_image: '',
    right_side_image: '',
    primary_cta_text: '',
    primary_cta_link: '',
    secondary_cta_text: '',
    secondary_cta_link: '',
    display_order: 0,
    is_active: true
  });
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingRightSide, setUploadingRightSide] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/v2/admin/hero-banners');
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        setError('Failed to fetch banners');
      } else {
        const data = await response.json();
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'background' | 'right_side') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = imageType === 'background' ? setUploadingBackground : setUploadingRightSide;
    setUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/v2/admin/upload/hero-banners', {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        const fieldName = imageType === 'background' ? 'background_image' : 'right_side_image';
        setFormData(prev => ({ ...prev, [fieldName]: data.url }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = editingBanner 
        ? `/api/v2/content/hero-banners/${editingBanner.banner_id}`
        : '/api/v2/content/hero-banners';
      
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchBanners();
        resetForm();
      } else {
        alert('Failed to save banner');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(`/api/v2/content/hero-banners/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchBanners();
      } else {
        alert('Failed to delete banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const handleEdit = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      background_image: banner.background_image || '',
      right_side_image: banner.right_side_image || '',
      primary_cta_text: banner.primary_cta_text || '',
      primary_cta_link: banner.primary_cta_link || '',
      secondary_cta_text: banner.secondary_cta_text || '',
      secondary_cta_link: banner.secondary_cta_link || '',
      display_order: banner.display_order,
      is_active: banner.is_active
    });
    setShowModal(true);
  };

  const toggleActive = async (banner: HeroBanner) => {
    try {
      const response = await fetch(`/api/v2/content/hero-banners/${banner.banner_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...banner, is_active: !banner.is_active })
      });

      if (response.ok) {
        fetchBanners();
      } else {
        alert('Failed to update banner status');
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      alert('Failed to update banner status');
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      background_image: '',
      right_side_image: '',
      primary_cta_text: '',
      primary_cta_link: '',
      secondary_cta_text: '',
      secondary_cta_link: '',
      display_order: 0,
      is_active: true
    });
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter banners based on search and status
  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         banner.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && banner.is_active) ||
                         (statusFilter === 'inactive' && !banner.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hero Banners</h1>
            <p className="text-gray-600 mt-1">Manage homepage hero section banners and content</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Banner
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
          >
            <option value="all">All Banners</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Total: {filteredBanners.length} banners
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
        </div>
      )}

      {/* Banners Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Background</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Right Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBanners.map((banner) => (
                  <tr key={banner.banner_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {banner.background_image ? (
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={banner.background_image}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No bg</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">{banner.title}</div>
                        <div className="text-sm text-gray-500 truncate">{banner.subtitle}</div>
                        <div className="text-xs text-gray-400 truncate">{banner.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {banner.right_side_image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={banner.right_side_image}
                            alt="Right side"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">None</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={banner.is_active ? 'text-green-600' : 'text-gray-400'}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {banner.display_order}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(banner.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleActive(banner)}
                          className={`${banner.is_active ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}`}
                          title={banner.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {banner.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Banner"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.banner_id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Banner"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredBanners.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No banners found
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Content Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Background Image</label>
                  <div className="space-y-2">
                    {formData.background_image && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <Image
                          src={formData.background_image}
                          alt="Background preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'background')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingBackground}
                    />
                    {uploadingBackground && <p className="text-sm text-gray-500">Uploading...</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Right Side Image</label>
                  <div className="space-y-2">
                    {formData.right_side_image && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <Image
                          src={formData.right_side_image}
                          alt="Right side preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'right_side')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingRightSide}
                    />
                    {uploadingRightSide && <p className="text-sm text-gray-500">Uploading...</p>}
                  </div>
                </div>
              </div>

              {/* Call to Action Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Primary Button</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Button Text</label>
                      <input
                        type="text"
                        value={formData.primary_cta_text}
                        onChange={(e) => setFormData({ ...formData, primary_cta_text: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Shop Now"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Button Link</label>
                      <input
                        type="text"
                        value={formData.primary_cta_link}
                        onChange={(e) => setFormData({ ...formData, primary_cta_link: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="/products"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Secondary Button</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Button Text</label>
                      <input
                        type="text"
                        value={formData.secondary_cta_text}
                        onChange={(e) => setFormData({ ...formData, secondary_cta_text: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Learn More"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Button Link</label>
                      <input
                        type="text"
                        value={formData.secondary_cta_link}
                        onChange={(e) => setFormData({ ...formData, secondary_cta_link: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="/about"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  {editingBanner ? 'Update' : 'Create'} Banner
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}