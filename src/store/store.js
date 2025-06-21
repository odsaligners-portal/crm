import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './features/auth/authSlice';
import patientFormReducer from './features/patientFormSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patientForm: patientFormReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch; 
export const useAppSelector = useSelector; 