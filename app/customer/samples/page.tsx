'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import SampleRequestWidget from '@/components/samples/SampleRequestWidget';

interface SampleOrder {
  sample_order_id: number;
  order_id: string;
  shipping_name: string;
  sample_count: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  priority: string;
  tracking_number?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  estimated_delivery?: string;
  items: Array<{
    swatch_name: string;
    material_name: string;
    category_name: string;
  }>;
}

export default function CustomerSamplesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SampleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SampleOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const statusIcons = {
    pending: { icon: Clock, color: 'text-yellow-600' },
    processing: { icon: Package, color: 'text-blue-600' },
    shipped: { icon: Truck, color: 'text-green-600' },
    delivered: { icon: CheckCircle, color: 'text-green-700' },
    cancelled: { icon: AlertCircle, color: 'text-red-600' },
  };

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-50 text-blue-800 border-blue-200',
    shipped: 'bg-green-50 text-green-800 border-green-200',
    delivered: 'bg-green-50 text-green-800 border-green-200',
    cancelled: 'bg-red-50 text-red-800 border-red-200',
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/sample-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching sample orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedDelivery = (order: SampleOrder) => {
    if (order.delivered_at) {
      return `Delivered ${new Date(order.delivered_at).toLocaleDateString()}`;
    }
    
    if (order.shipped_at) {
      const shippedDate = new Date(order.shipped_at);
      const estimatedDays = order.priority === 'EXPRESS' ? 2 : 5;
      const estimatedDate = new Date(shippedDate);
      estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
      return `Est. delivery: ${estimatedDate.toLocaleDateString()}`;
    }

    if (order.status === 'processing') {
      return 'Processing - will ship soon';
    }

    return 'Pending processing';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view your sample orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Samples</h1>
              <p className="text-gray-600 mt-1">
                Track your sample requests and order new material swatches
              </p>
            </div>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="bg-primary-red text-white px-6 py-2 rounded-lg hover:bg-primary-red-dark transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Samples
            </button>
          </div>
        </div>

        {/* Sample Request Widget */}
        {showRequestForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Request New Samples</h2>
              <button
                onClick={() => setShowRequestForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <SampleRequestWidget
              userEmail={user.email}
              onRequestComplete={(orderId) => {
                setShowRequestForm(false);
                fetchOrders();
              }}
            />
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sample Order History</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No sample orders yet</p>
              <p className="text-sm text-gray-400">
                Request your first samples to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status].icon;
                const statusColor = statusIcons[order.status].color;
                
                return (
                  <div key={order.sample_order_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                          <span className="font-medium text-gray-900">
                            Order #{order.order_id}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[order.status]}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {order.priority === 'EXPRESS' && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800 border border-orange-200">
                              Express
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Samples:</span> {order.sample_count}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> ${order.total_amount.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Ordered:</span> {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {order.tracking_number && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Tracking:</span> {order.tracking_number}
                          </div>
                        )}

                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Status:</span> {getEstimatedDelivery(order)}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetail(true);
                          }}
                          className="text-primary-red hover:text-primary-red-dark"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {order.tracking_number && (
                          <a
                            href={`https://www.ups.com/track?tracknum=${order.tracking_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Truck className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Sample Order #{selectedOrder.order_id}
                  </h3>
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedOrder.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <p className="text-sm text-gray-900">{selectedOrder.priority}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Sample Count</label>
                      <p className="text-sm text-gray-900">{selectedOrder.sample_count}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Amount</label>
                      <p className="text-sm text-gray-900">${selectedOrder.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Order Date</label>
                      <p className="text-sm text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tracking Number</label>
                        <p className="text-sm text-gray-900">{selectedOrder.tracking_number}</p>
                      </div>
                    )}
                  </div>

                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Samples Ordered</label>
                      <div className="mt-2 space-y-2">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            <div className="font-medium">{item.swatch_name}</div>
                            <div className="text-gray-600">{item.material_name} - {item.category_name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}