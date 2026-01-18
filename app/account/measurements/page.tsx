'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RulerIcon, SearchIcon, FilterIcon, PlusIcon,
  PencilIcon, TrashIcon, ChevronDownIcon,
  ArrowUpDownIcon, SaveIcon, XIcon, AlertTriangleIcon, Sparkles
} from 'lucide-react';

interface Measurement {
  id: number;
  name: string;
  room: string;
  window_type: string;
  width: number;
  height: number;
  notes: string;
  created_at: string;
  calibration_method?: string;
  confidence_score?: number;
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState<Measurement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    room: '',
    window_type: '',
    width: '',
    height: '',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMeasurements();
  }, [roomFilter, sortBy, sortOrder]);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roomFilter) params.append('room', roomFilter);
      params.append('sort', sortBy);
      params.append('order', sortOrder);

      // Fetch from API
      const res = await fetch(`/api/v2/users/measurements?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to fetch measurements');
      }

      const data = await res.json();
      setMeasurements(data.measurements || []);
      setAvailableRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
      // Set empty state on error
      setMeasurements([]);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMeasurements();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleAddNew = () => {
    setFormData({
      id: 0,
      name: '',
      room: '',
      window_type: '',
      width: '',
      height: '',
      notes: ''
    });
    setIsEditing(false);
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (measurement: Measurement) => {
    setFormData({
      id: measurement.id,
      name: measurement.name,
      room: measurement.room,
      window_type: measurement.window_type,
      width: measurement.width.toString(),
      height: measurement.height.toString(),
      notes: measurement.notes
    });
    setIsEditing(true);
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = (measurement: Measurement) => {
    setMeasurementToDelete(measurement);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!measurementToDelete) return;

    try {
      // Call API to delete measurement
      const res = await fetch(`/api/v2/users/measurements?id=${measurementToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete measurement');
      }

      // Remove from local state
      setMeasurements(prev => prev.filter(m => m.id !== measurementToDelete.id));

      // Close modal
      setShowDeleteModal(false);
      setMeasurementToDelete(null);
    } catch (error) {
      console.error('Error deleting measurement:', error);
      alert('Failed to delete measurement. Please try again.');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for the field being changed
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.room.trim()) {
      errors.room = 'Room is required';
    }

    if (!formData.window_type.trim()) {
      errors.window_type = 'Window type is required';
    }

    if (!formData.width.trim()) {
      errors.width = 'Width is required';
    } else if (isNaN(parseFloat(formData.width)) || parseFloat(formData.width) <= 0) {
      errors.width = 'Width must be a positive number';
    }

    if (!formData.height.trim()) {
      errors.height = 'Height is required';
    } else if (isNaN(parseFloat(formData.height)) || parseFloat(formData.height) <= 0) {
      errors.height = 'Height must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Call API to save measurement
      const res = await fetch('/api/v2/users/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Failed to save measurement');
      }

      const data = await res.json();

      // Update local state
      if (isEditing) {
        setMeasurements(prev => prev.map(m => m.id === formData.id ? data.measurement : m));
      } else {
        setMeasurements(prev => [...prev, data.measurement]);
      }

      // Close form
      setShowForm(false);

      // Refresh measurements
      fetchMeasurements();
    } catch (error) {
      console.error('Error saving measurement:', error);
      alert('Failed to save measurement. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Measurements</h1>
          <p className="text-gray-500">Saved window measurements for easy ordering</p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Measurement
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search measurements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <span className="text-sm text-red-600">Search</span>
            </button>
          </form>

          <div className="relative">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
            >
              <option value="">All Rooms</option>
              {availableRooms.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="room-asc">Room (A-Z)</option>
              <option value="width-desc">Width (Largest First)</option>
              <option value="height-desc">Height (Largest First)</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDownIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* New/Edit Measurement Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              {isEditing ? 'Edit Measurement' : 'Add New Measurement'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Measurement Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={`w-full p-2 border rounded-md ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. Living Room Main Window"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
                  Room*
                </label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  className={`w-full p-2 border rounded-md ${formErrors.room ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. Living Room"
                  list="room-suggestions"
                />
                <datalist id="room-suggestions">
                  {availableRooms.map((room) => (
                    <option key={room} value={room} />
                  ))}
                </datalist>
                {formErrors.room && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.room}</p>
                )}
              </div>

              <div>
                <label htmlFor="window_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Window Type*
                </label>
                <select
                  id="window_type"
                  name="window_type"
                  value={formData.window_type}
                  onChange={handleFormChange}
                  className={`w-full p-2 border rounded-md ${formErrors.window_type ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Window Type</option>
                  <option value="Double-Hung">Double-Hung</option>
                  <option value="Single-Hung">Single-Hung</option>
                  <option value="Casement">Casement</option>
                  <option value="Sliding">Sliding</option>
                  <option value="Picture Window">Picture Window</option>
                  <option value="Bay Window">Bay Window</option>
                  <option value="Awning">Awning</option>
                  <option value="Skylight">Skylight</option>
                </select>
                {formErrors.window_type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.window_type}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                    Width (inches)*
                  </label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    value={formData.width}
                    onChange={handleFormChange}
                    step="0.125"
                    min="0"
                    className={`w-full p-2 border rounded-md ${formErrors.width ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. 36.5"
                  />
                  {formErrors.width && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.width}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                    Height (inches)*
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleFormChange}
                    step="0.125"
                    min="0"
                    className={`w-full p-2 border rounded-md ${formErrors.height ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. 72.25"
                  />
                  {formErrors.height && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.height}</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Add any special considerations about this window"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <SaveIcon className="h-4 w-4 mr-1" />
                {isEditing ? 'Update' : 'Save'} Measurement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Measurements List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      ) : measurements.length > 0 ? (
        <div className="space-y-4">
          {measurements.map((measurement) => (
            <div
              key={measurement.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row"
            >
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{measurement.name}</h3>
                      {measurement.calibration_method && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-red-500 to-primary-dark text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </span>
                      )}
                      {measurement.confidence_score && measurement.confidence_score > 0.8 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          High Confidence
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{measurement.room} • {measurement.window_type}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-sm text-gray-500">
                    Added: {formatDate(measurement.created_at)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center">
                      <RulerIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dimensions</p>
                        <p className="text-sm text-gray-600">
                          {measurement.width}" W × {measurement.height}" H
                        </p>
                      </div>
                    </div>
                  </div>

                  {measurement.notes && (
                    <div className="md:col-span-1">
                      <p className="text-sm font-medium text-gray-900">Notes</p>
                      <p className="text-sm text-gray-600">{measurement.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 md:mt-0 md:ml-4 flex flex-row md:flex-col justify-end space-x-2 md:space-x-0 md:space-y-2">
                <Link
                  href={`/products?width=${measurement.width}&height=${measurement.height}`}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 flex items-center justify-center"
                >
                  Shop Now
                </Link>
                <button
                  onClick={() => handleEdit(measurement)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center justify-center"
                >
                  <PencilIcon className="h-3.5 w-3.5 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(measurement)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 flex items-center justify-center"
                >
                  <TrashIcon className="h-3.5 w-3.5 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <RulerIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Measurements Found</h3>
          <p className="mt-2 text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || roomFilter
              ? 'No measurements match your search filters. Try adjusting your criteria.'
              : "You haven't saved any window measurements yet. Add your first measurement to keep track of window sizes for easy ordering."}
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Add Your First Measurement
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && measurementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
              Delete Measurement
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Are you sure you want to delete <span className="font-medium">{measurementToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMeasurementToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
