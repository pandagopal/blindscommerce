'use client';

import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: number;
  status: string;
  canBeModified: boolean;
  modificationDeadline: string | null;
  items: OrderItem[];
  shippingAddress: any;
  shippingMethod: string;
  specialInstructions: string;
}

interface OrderModificationModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onModificationSubmitted: () => void;
}

const OrderModificationModal: React.FC<OrderModificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onModificationSubmitted
}) => {
  const [modificationType, setModificationType] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setItems(order.items.map(item => ({
        ...item,
        originalQuantity: item.quantity,
        newQuantity: item.quantity,
        action: 'quantity_change'
      })));
      setShippingAddress(order.shippingAddress);
      setShippingMethod(order.shippingMethod);
      setSpecialInstructions(order.specialInstructions || '');
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const modificationData: any = {
        modificationType,
        reason
      };

      // Add specific data based on modification type
      if (modificationType === 'item_quantity') {
        modificationData.items = items
          .filter(item => item.newQuantity !== item.originalQuantity)
          .map(item => ({
            orderItemId: item.id,
            productId: item.productId,
            previousQuantity: item.originalQuantity,
            newQuantity: item.newQuantity,
            unitPrice: item.unitPrice,
            action: 'quantity_change'
          }));
      } else if (modificationType === 'shipping_address') {
        modificationData.shippingAddress = shippingAddress;
      } else if (modificationType === 'shipping_method') {
        modificationData.shippingMethod = shippingMethod;
      } else if (modificationType === 'special_instructions') {
        modificationData.specialInstructions = specialInstructions;
      }

      const response = await fetch(`/api/orders/${order.id}/modifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit modification request');
      }

      onModificationSubmitted();
      onClose();
      resetForm();

    } catch (err) {
      console.error('Error submitting modification:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit modification request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setModificationType('');
    setReason('');
    setError(null);
  };

  const handleItemQuantityChange = (itemId: number, newQuantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, newQuantity: Math.max(0, newQuantity) }
        : item
    ));
  };

  const isModificationValid = () => {
    if (!modificationType || !reason.trim()) return false;

    if (modificationType === 'item_quantity') {
      return items.some(item => item.newQuantity !== item.originalQuantity);
    }

    return true;
  };

  const calculatePriceDifference = () => {
    if (modificationType !== 'item_quantity') return 0;

    return items.reduce((total, item) => {
      const quantityDiff = item.newQuantity - item.originalQuantity;
      return total + (quantityDiff * item.unitPrice);
    }, 0);
  };

  if (!isOpen) return null;

  const priceDifference = calculatePriceDifference();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Modify Order #{order.id}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {order.modificationDeadline && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">
                <strong>Modification Deadline:</strong> {new Date(order.modificationDeadline).toLocaleString()}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Modification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to modify?
              </label>
              <select
                value={modificationType}
                onChange={(e) => setModificationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select modification type</option>
                <option value="item_quantity">Change item quantities</option>
                <option value="shipping_address">Update shipping address</option>
                <option value="shipping_method">Change shipping method</option>
                <option value="special_instructions">Update special instructions</option>
                <option value="cancel_order">Cancel entire order</option>
              </select>
            </div>

            {/* Item Quantity Changes */}
            {modificationType === 'item_quantity' && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Update Item Quantities</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">Original: {item.originalQuantity}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item.id, item.newQuantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.newQuantity}</span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item.id, item.newQuantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                        {item.newQuantity !== item.originalQuantity && (
                          <span className={`text-sm font-medium ${
                            item.newQuantity > item.originalQuantity ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.newQuantity > item.originalQuantity ? '+' : ''}
                            ${((item.newQuantity - item.originalQuantity) * item.unitPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {priceDifference !== 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Price Change:</span>
                      <span className={`font-bold ${priceDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceDifference > 0 ? '+' : ''}${Math.abs(priceDifference).toFixed(2)}
                      </span>
                    </div>
                    {priceDifference > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Additional payment will be required after approval.
                      </p>
                    )}
                    {priceDifference < 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        A refund will be processed after approval.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shipping Address */}
            {modificationType === 'shipping_address' && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Update Shipping Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={shippingAddress?.firstName || ''}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={shippingAddress?.lastName || ''}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={shippingAddress?.line1 || ''}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, line1: e.target.value }))}
                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingAddress?.city || ''}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={shippingAddress?.state || ''}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={shippingAddress?.postalCode || ''}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {modificationType === 'special_instructions' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any special delivery or handling instructions..."
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for modification *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please explain why you need to modify this order..."
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isModificationValid() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Modification Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderModificationModal;