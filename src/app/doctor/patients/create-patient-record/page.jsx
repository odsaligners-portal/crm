import { redirect } from 'next/navigation';

export default function CreatePatientRecordPage() {
  redirect('/doctor/patients/create-patient-record/step-1');
  return null;
}
