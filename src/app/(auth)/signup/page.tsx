import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Next.js CRM",
  description: "Create a new account",
};

export default function SignUp() {
  return <SignUpForm />;
} 