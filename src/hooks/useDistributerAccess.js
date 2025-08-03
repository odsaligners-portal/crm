import { useState } from 'react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

export const useDistributerAccess = () => {
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);

  const updateAccess = async (distributerId, access) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/distributers/access', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ distributerId, access })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update access');

      toast.success(data.message);
      return data.distributer;
    } catch (error) {
      toast.error(error.message || 'Failed to update access');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateAccess = async (distributerIds, access) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/distributers/access', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ distributerIds, access })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bulk update access');

      toast.success(data.message);
      return data.data;
    } catch (error) {
      toast.error(error.message || 'Failed to bulk update access');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAccessInfo = async (distributerId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/distributers/access?distributerId=${distributerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get access info');

      return data.distributer;
    } catch (error) {
      toast.error(error.message || 'Failed to get access info');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateAccess = (access) => {
    const validAccessLevels = ['view', 'full'];
    return validAccessLevels.includes(access);
  };

  const getAccessLabel = (access) => {
    const labels = {
      'view': 'View Only',
      'full': 'Full Access'
    };
    return labels[access] || 'Unknown';
  };

  const getAccessColor = (access) => {
    const colors = {
      'view': 'text-blue-600 bg-blue-100',
      'full': 'text-green-600 bg-green-100'
    };
    return colors[access] || 'text-gray-600 bg-gray-100';
  };

  return {
    updateAccess,
    bulkUpdateAccess,
    getAccessInfo,
    validateAccess,
    getAccessLabel,
    getAccessColor,
    loading
  };
};

export default useDistributerAccess;
