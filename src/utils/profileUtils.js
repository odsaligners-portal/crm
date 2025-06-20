import { fetchWithError } from './apiErrorHandler';

export const updateUserProfile = async (token, data) => {
  return await fetchWithError('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const updateUserAddress = async (token, address) => {
  return await fetchWithError('/api/user/profile/address', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
}; 