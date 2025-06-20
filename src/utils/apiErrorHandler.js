import { toast } from 'react-toastify';

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
  try {
    const response = await fetch(url, options);
    return await handleApiError(response);
  } catch (error) {
    const errorMessage = handleFetchError(error);
    toast.error(errorMessage);
    throw error;
  }
}; 