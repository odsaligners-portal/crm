import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PatientFormData {
  patientName: string;
  age: string;
  gender: string;
  pastMedicalHistory: string;
  pastDentalHistory: string;
  treatmentFor: string;
  country: string;
  state: string;
  city: string;
  primaryAddress: string;
  shippingAddressType: string;
  shippingAddress: string;
  billingAddress: string;
  chiefComplaint: string;
  caseType: string;
  caseCategory: string;
  caseCategoryDetails: string;
  treatmentPlan: string;
  singleArchType?: string;
  selectedPrice: string;
  extraction: {
    required: boolean;
    comments: string;
  };
  interproximalReduction: {
    detail1: string;
    detail2: string;
    detail3: string;
    detail4: string;
  };
  measureOfIPR: {
    detailA: string;
    detailB: string;
    detailC: string;
  };
  additionalComments: string;
  midline: string;
  midlineComments: string;
  archExpansion: string;
  archExpansionComments: string;
  scanFiles: File[];
  privacyAccepted: boolean;
  declarationAccepted: boolean;
  caseId?: string;
}

const initialState: PatientFormData = {
  patientName: '',
  age: '',
  gender: '',
  pastMedicalHistory: '',
  pastDentalHistory: '',
  treatmentFor: '',
  country: '',
  state: '',
  city: '',
  primaryAddress: '',
  shippingAddressType: 'Primary Address',
  shippingAddress: '',
  billingAddress: '',
  chiefComplaint: '',
  caseType: '',
  caseCategory: '',
  caseCategoryDetails: '',
  treatmentPlan: '',
  singleArchType: '',
  selectedPrice: '',
  extraction: { required: false, comments: '' },
  interproximalReduction: { detail1: '', detail2: '', detail3: '', detail4: '' },
  measureOfIPR: { detailA: '', detailB: '', detailC: '' },
  additionalComments: '',
  midline: '',
  midlineComments: '',
  archExpansion: '',
  archExpansionComments: '',
  scanFiles: [],
  privacyAccepted: false,
  declarationAccepted: false,
  caseId: undefined,
};

const patientFormSlice = createSlice({
  name: 'patientForm',
  initialState,
  reducers: {
    setField: (state, action: PayloadAction<{ field: string; value: any }>) => {
      (state as any)[action.payload.field] = action.payload.value;
    },
    setNestedField: (state, action: PayloadAction<{ section: string; field: string; value: any }>) => {
      (state as any)[action.payload.section][action.payload.field] = action.payload.value;
    },
    setForm: (state, action: PayloadAction<Partial<PatientFormData>>) => {
      return { ...state, ...action.payload };
    },
    resetForm: () => initialState,
    setFiles: (state, action: PayloadAction<File[]>) => {
      state.scanFiles = action.payload;
    },
  },
});

export const { setField, setNestedField, setForm, resetForm, setFiles } = patientFormSlice.actions;
export default patientFormSlice.reducer; 