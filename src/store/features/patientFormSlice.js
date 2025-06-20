import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
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
    setField: (state, action) => {
      state[action.payload.field] = action.payload.value;
    },
    setNestedField: (state, action) => {
      state[action.payload.section][action.payload.field] = action.payload.value;
    },
    setForm: (state, action) => {
      Object.assign(state, action.payload);
    },
    resetForm: () => initialState,
    setFiles: (state, action) => {
      state.scanFiles = action.payload;
    },
  },
});

export const { setField, setNestedField, setForm, resetForm, setFiles } = patientFormSlice.actions;
export default patientFormSlice.reducer; 