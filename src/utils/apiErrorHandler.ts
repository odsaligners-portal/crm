import { toast } from 'react-toastify';

interface ApiError extends Error {
  status?: number;
  data?: any;
}

export class FetchError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export const handleApiError = async (response: Response) => {
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

export const handleFetchError = (error: ApiError): string => {
  // Network errors
  if (!error.status) {
    return 'Network error. Please check your connection.';
  }

  // Handle specific status codes
  switch (error.status) {
    case 400:
      return error.message || 'Invalid request.';
    case 401:
      return 'Invalid Credentials.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return error.message || 'Validation failed.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Internal server error. Please try again later.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
};

export const fetchWithError = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    return await handleApiError(response);
  } catch (error: any) {
    const errorMessage = handleFetchError(error);
    toast.error(errorMessage);
    throw error;
  }
}; 