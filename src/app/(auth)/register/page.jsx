import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata = {
  title: "Registrations | ODS CRM",
  description: "Create a new account",
};

export default function SignUp() {
  return <SignUpForm />;
} 