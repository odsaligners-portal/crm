import { redirect } from 'next/navigation';

export default function CreatePatientRecordPage() {
  redirect('./step-1');
  return null;
}
