"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "@/store/features/auth/authSlice";

export function useSuspensionCheck() {
  const { token, user } = useSelector((state) => state.auth);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const checkSuspensionStatus = async () => {
      if (!token || !user) {
        setIsChecking(false);
        return;
      }

      // Only check for doctor and admin roles
      if (user.role !== "doctor" && user.role !== "admin") {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user?.isSuspended) {
            setIsSuspended(true);
            // Clear auth state and redirect to signin
            setTimeout(() => {
              dispatch(logout());
              router.push("/signin");
            }, 100);
          } else {
            setIsSuspended(false);
          }
        } else if (response.status === 403) {
          // Account is suspended
          const data = await response.json();
          if (data.isSuspended) {
            setIsSuspended(true);
            // Clear auth state and redirect to signin
            setTimeout(() => {
              dispatch(logout());
              router.push("/signin");
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error checking suspension status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSuspensionStatus();
  }, [token, user, dispatch, router]);

  return { isSuspended, isChecking };
}
