import { fetchWithError } from './apiErrorHandler';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  phone: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  address: {
    country: string;
    city: string;
    postalCode: string;
    taxId: string;
  };
}

export const updateUserProfile = async (token: string, data: Partial<UserProfile>) => {
  return await fetchWithError('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const updateUserAddress = async (token: string, address: Partial<UserProfile['address']>) => {
  return await fetchWithError('/api/user/profile/address', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
}; 