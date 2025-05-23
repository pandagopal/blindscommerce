import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function VendorProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;
  const [form, setForm] = useState({
    name: '',
    slug: '',
    type_id: 1,
    base_price: '',
    is_active: true,
    is_listing_enabled: true,
    series_name: '',
    material_type: '',
    short_description: '',
    full_description: '',
    features: '',
    benefits: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/vendor/products`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        const product = (data.products || []).find((p: any) => p.product_id == productId);
        if (!product) throw new Error('Product not found');
        setForm({
          name: product.name || '',
          slug: product.slug || '',
          type_id: product.type_id || 1,
          base_price: product.base_price?.toString() || '',
          is_active: !!product.is_active,
          is_listing_enabled: !!product.is_listing_enabled,
          series_name: product.series_name || '',
          material_type: product.material_type || '',
          short_description: product.short_description || '',
          full_description: product.full_description || '',
          features: Array.isArray(product.features) ? product.features.join(', ') : (product.features || ''),
          benefits: Array.isArray(product.benefits) ? product.benefits.join(', ') : (product.benefits || ''),
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          product_id: Number(productId),
          type_id: Number(form.type_id),
          base_price: Number(form.base_price),
          features: form.features ? form.features.split(',').map(f => f.trim()) : [],
          benefits: form.benefits ? form.benefits.split(',').map(b => b.trim()) : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }
      router.push('/vendor/products');
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Slug</label>
          <input name="slug" value={form.slug} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Type</label>
          <select name="type_id" value={form.type_id} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={1}>Blinds</option>
            <option value={2}>Shades</option>
            <option value={3}>Drapes</option>
            <option value={4}>Shutters</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Base Price</label>
          <input name="base_price" type="number" value={form.base_price} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_listing_enabled" checked={form.is_listing_enabled} onChange={handleChange} /> Listed
          </label>
        </div>
        <div>
          <label className="block font-medium mb-1">Series Name</label>
          <input name="series_name" value={form.series_name} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Material Type</label>
          <input name="material_type" value={form.material_type} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Short Description</label>
          <textarea name="short_description" value={form.short_description} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Full Description</label>
          <textarea name="full_description" value={form.full_description} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Features (comma separated)</label>
          <input name="features" value={form.features} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Benefits (comma separated)</label>
          <input name="benefits" value={form.benefits} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark" disabled={saving}>
          {saving ? 'Saving...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
} 