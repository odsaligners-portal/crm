import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata = {
  title: "Registrations | PORTAL",
  description: "Create a new account",
};

export default function SignUp() {
  return <SignUpForm />;
}
