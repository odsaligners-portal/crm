import { toast } from 'react-toastify';
import { store } from '@/store/store';
import { setLoading } from '@/store/features/uiSlice';

export class FetchError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const handleApiError = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new FetchError(
      data.message || 'Something went wrong',
      response.status,
      data
    );
    throw error;
  }
  
  return data;
};

export const handleFetchError = (error) => {
  // Network errors
  if (!error.status) {
    return 'Network error. Please try again later.';
  }
  // API errors
  if (error.data && error.data.message) {
    return error.data.message;
  }
  return error.message || 'An unknown error occurred.';
};

export const fetchWithError = async (url, options) => {
  store.dispatch(setLoading(true));
  try {
    const response = await fetch(url, options);
    return await handleApiError(response); // Corrected line
  } catch (error) {
    const errorMessage = handleFetchError(error);
    toast.error(errorMessage);
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};