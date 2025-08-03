"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";

const MainPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, role, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setLoading(true));
    if (!token || !role || !user) {
      router.push("/signin");
    } else if (role === "admin") {
      router.push("/admin");
    } else if (role === "doctor") {
      router.push("/doctor");
    } else if (role === "planner") {
      router.push("/planner");
    } else if (role === "distributer") {
      router.push("/distributer");
    }
  }, [token, role, user, router, dispatch]);

  return null;
};

export default MainPage;
