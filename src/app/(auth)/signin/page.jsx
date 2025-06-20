import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata = {
  title: "Sign In | Next.js CRM",
  description: "Sign in to your account",
};

export default function SignIn() {
  return <SignInForm />;
} 