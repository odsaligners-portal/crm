"use client";
import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function NotFound() {
  const router = useRouter();
  const { role, token } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth state to be hydrated from localStorage
    toast.error("We can't seem to find the page you are looking for!")
    setTimeout(()=>{
      if (typeof token !== "undefined") {
        if (token && role) {
          const redirectPath =
            role === "doctor"
              ? "/doctor"
              : role === "admin"
              ? "/admin"
              : role === "super-admin" ? "/super-admin" : '/'
          router.push(redirectPath);
        } else {
          // No user logged in, so show the 404 page
          setIsReady(true);
        }
      }
    },[2000])
  }, [token, role, router]);

  if (!isReady) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
          ERROR
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="404"
          className="dark:hidden"
          width={472}
          height={152}
        />
        <Image
          src="/images/error/404-dark.svg"
          alt="404"
          className="hidden dark:block"
          width={472}
          height={152}
        />

        <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          We can't seem to find the page you are looking for!
        </p>
      </div>
      {/* <!-- Footer --> */}
      <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - ODS Aligners
      </p>
    </div>
    );
  }

  return null;
}
