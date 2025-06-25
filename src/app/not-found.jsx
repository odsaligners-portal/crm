"use client";
import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";

export default function NotFound() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { role, token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setLoading(true)); // Start with the loader

    const timer = setTimeout(() => {
      // After a short delay to allow for auth state hydration
      if (token && role) {
        const redirectPath =
          role === "doctor"
            ? "/doctor"
            : role === "admin"
            ? "/admin"
            : role === "super-admin" ? "/super-admin" : '/';
        
        toast.info("Page not found, redirecting to your dashboard.");
        router.push(redirectPath);
        // Loader will remain active until the new page loads
      } else {
        // No user logged in, show the 404 page
        dispatch(setLoading(false));
        toast.error("We can't seem to find the page you are looking for!");
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);

  }, [token, role, router, dispatch]);

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
