import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata = {
  title: "Forgot Password | Next.js CRM",
  description: "Reset your password",
};

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
} 