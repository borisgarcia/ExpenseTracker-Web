import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import type {
  PaymentMethod,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from '../utils/paymentMethods';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMethods = useCallback(async () => {
    try {
      const data = await api.get('/payment-methods');
      setPaymentMethods(data);
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const createMethod = async (payload: CreatePaymentMethodPayload): Promise<PaymentMethod> => {
    const created = await api.post('/payment-methods', payload);
    setPaymentMethods((prev) => [...prev, created]);
    return created;
  };

  const updateMethod = async (id: string, payload: UpdatePaymentMethodPayload): Promise<PaymentMethod> => {
    const updated = await api.patch(`/payment-methods/${id}`, payload);
    setPaymentMethods((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const deleteMethod = async (id: string): Promise<void> => {
    await api.delete(`/payment-methods/${id}`);
    // Soft delete — remove from active list
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const setDefaultMethod = async (id: string): Promise<void> => {
    const updated = await api.post(`/payment-methods/${id}/set-default`, {});
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id ? true : false }))
    );
    return updated;
  };

  const payCard = async (id: string, fromBankAccountId?: string): Promise<PaymentMethod> => {
    const updated = await api.post(`/payment-methods/${id}/pay`, { fromBankAccountId });
    setPaymentMethods((prev) =>
      prev.map((m) => {
        if (m.id === id) return updated;
        return m;
      })
    );
    // Refetch in background to update the bank account balance as well
    if (fromBankAccountId) {
      fetchMethods();
    }
    return updated;
  };

  const defaultMethod = paymentMethods.find((m) => m.isDefault) ?? paymentMethods[0];

  return {
    paymentMethods,
    isLoading,
    defaultMethod,
    createMethod,
    updateMethod,
    deleteMethod,
    setDefaultMethod,
    payCard,
    refetch: fetchMethods,
  };
};
