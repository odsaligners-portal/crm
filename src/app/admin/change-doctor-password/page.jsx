"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { MdLockOutline } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";

export default function ChangeDoctorPasswordPage() {
  const [doctors, setDoctors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [passwords, setPasswords] = useState({});
  const [adminPasswords, setAdminPasswords] = useState({});
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { token } = useSelector((state) => state.auth) || {};
  const router = useRouter();
  const dispatch = useDispatch();
  const [hasAccess, setHasAccess] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const togglePasswordVisibility = (userId, field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: !prev[userId]?.[field],
      },
    }));
  };

  useEffect(() => {
    const fetchAccess = async () => {
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasAccess(data.user.changeDoctorPasswordAccess);
        const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
        if (data.user.id === superAdminId) {
          setIsSuperAdmin(true);
        }
      } catch (err) {
        setHasAccess(false);
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (token) {
      fetchAccess();
    } else if (token === null) {
      dispatch(setLoading(false));
      setHasAccess(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    async function fetchUsers() {
      dispatch(setLoading(true));
      try {
        // Fetch doctors
        const doctorUrl = new URL(
          "/api/user/profile?role=doctor",
          window.location.origin,
        );
        if (debouncedSearchTerm) {
          doctorUrl.searchParams.append("search", debouncedSearchTerm);
        }
        const doctorData = await fetchWithError(doctorUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(doctorData.doctors || []);

        // Fetch other admins if super admin
        if (isSuperAdmin) {
          const adminUrl = new URL(
            "/api/user/profile?otherAdmins=true",
            window.location.origin,
          );
          if (debouncedSearchTerm) {
            adminUrl.searchParams.append("search", debouncedSearchTerm);
          }
          const adminData = await fetchWithError(adminUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAdmins(adminData.admins || []);
        }
      } catch (err) {
      } finally {
        dispatch(setLoading(false));
      }
    }
    if (token && hasAccess) {
      fetchUsers();
    } else if (hasAccess === false) {
      dispatch(setLoading(false));
    }
  }, [token, debouncedSearchTerm, hasAccess, isSuperAdmin, dispatch]);

  const handlePasswordChange = (userId, field, value, userType = "doctor") => {
    const setPasswordsState =
      userType === "admin" ? setAdminPasswords : setPasswords;
    setPasswordsState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (userId, userType = "doctor") => {
    const { password, confirmPassword } =
      userType === "admin" ? adminPasswords[userId] : passwords[userId] || {};
    if (!password || !confirmPassword) {
      return toast.error("Password and confirm password are required.");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    dispatch(setLoading(true));
    try {
      await fetchWithError("/api/admin/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, password }),
      });

      toast.success("Password updated successfully");
      const setPasswordsState =
        userType === "admin" ? setAdminPasswords : setPasswords;
      setPasswordsState((prev) => ({
        ...prev,
        [userId]: { password: "", confirmPassword: "" },
      }));
    } catch (err) {
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (hasAccess === null)
    return (
      <div className="flex h-64 items-center justify-center p-5 lg:p-6">
        <div className="border-t-brand-500 h-16 w-16 animate-spin rounded-full border-4 border-t-4 border-gray-200"></div>
      </div>
    );

  if (hasAccess === false) {
    return (
      <div className="from-white-50 dark:to-white-900/50 flex min-h-screen items-center justify-center bg-gradient-to-br to-blue-100 p-4 dark:from-gray-900">
        <div className="relative w-full max-w-md transform rounded-2xl border-2 border-red-200 bg-white p-8 text-center shadow-2xl transition-transform duration-300 ease-in-out hover:scale-105 dark:border-red-700 dark:bg-gray-800">
          <div className="absolute top-4 right-4 text-red-400 dark:text-red-500">
            <MdLockOutline size={24} />
          </div>
          <div className="mb-4 inline-block rounded-full border-4 border-white bg-red-100 p-2 shadow-lg dark:border-gray-800 dark:bg-red-900/50">
            <MdLockOutline
              size={40}
              className="text-red-500 dark:text-red-300"
            />
          </div>
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-red-700 drop-shadow-sm dark:text-red-300">
            Access Denied
          </h1>
          <p className="font-medium text-gray-600 dark:text-gray-400">
            You do not have the necessary permissions to access this page.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 transform rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-150 ease-in-out hover:translate-y-px hover:from-red-600 hover:to-orange-600 focus:ring-4 focus:ring-red-300 focus:outline-none dark:focus:ring-red-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      {isSuperAdmin && (
        <div className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
                Admin Passwords
              </h1>
              <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
                Update passwords for admin accounts
              </p>
            </div>
          </div>
          <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />
          <div className="relative mx-auto w-full overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md dark:bg-gray-900/80">
            <Table className="relative z-10 mx-auto min-w-full font-sans text-xs">
              <TableHeader>
                <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
                  <TableCell
                    isHeader
                    className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    S.N.
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Password
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Confirm Password
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-3 py-2 text-center font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin, idx) => (
                  <TableRow
                    key={admin._id}
                    className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-2 py-1 font-semibold text-blue-600 dark:text-blue-300">
                      {admin.name}
                    </TableCell>
                    <TableCell className="px-2 py-1 font-medium">
                      {admin.email}
                    </TableCell>
                    <TableCell className="relative px-2 py-1">
                      <input
                        type={
                          passwordVisibility[admin._id]?.password
                            ? "text"
                            : "password"
                        }
                        value={adminPasswords[admin._id]?.password || ""}
                        onChange={(e) =>
                          handlePasswordChange(
                            admin._id,
                            "password",
                            e.target.value,
                            "admin",
                          )
                        }
                        className="w-full rounded border bg-white px-2 py-1 pr-8 text-xs dark:bg-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          togglePasswordVisibility(admin._id, "password")
                        }
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      >
                        {passwordVisibility[admin._id]?.password ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="relative px-2 py-1">
                      <input
                        type={
                          passwordVisibility[admin._id]?.confirmPassword
                            ? "text"
                            : "password"
                        }
                        value={adminPasswords[admin._id]?.confirmPassword || ""}
                        onChange={(e) =>
                          handlePasswordChange(
                            admin._id,
                            "confirmPassword",
                            e.target.value,
                            "admin",
                          )
                        }
                        className="w-full rounded border bg-white px-2 py-1 pr-8 text-xs dark:bg-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          togglePasswordVisibility(admin._id, "confirmPassword")
                        }
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      >
                        {passwordVisibility[admin._id]?.confirmPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <button
                        onClick={() => handleSubmit(admin._id, "admin")}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                      >
                        Update
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Change Doctor's Password
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            Update passwords for doctor accounts
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />
      <div className="relative mx-auto w-full overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-xs">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
              <TableCell
                isHeader
                className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                S.N.
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Password
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Confirm Password
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor, idx) => (
              <TableRow
                key={doctor._id}
                className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300">
                  {idx + 1}
                </TableCell>
                <TableCell className="px-2 py-1 font-semibold text-blue-600 dark:text-blue-300">
                  {doctor.name}
                </TableCell>
                <TableCell className="px-2 py-1 font-medium">
                  {doctor.email}
                </TableCell>
                <TableCell className="relative px-2 py-1">
                  <input
                    type={
                      passwordVisibility[doctor._id]?.password
                        ? "text"
                        : "password"
                    }
                    value={passwords[doctor._id]?.password || ""}
                    onChange={(e) =>
                      handlePasswordChange(
                        doctor._id,
                        "password",
                        e.target.value,
                      )
                    }
                    className="w-full rounded border bg-white px-2 py-1 pr-8 text-xs dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      togglePasswordVisibility(doctor._id, "password")
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  >
                    {passwordVisibility[doctor._id]?.password ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </TableCell>
                <TableCell className="relative px-2 py-1">
                  <input
                    type={
                      passwordVisibility[doctor._id]?.confirmPassword
                        ? "text"
                        : "password"
                    }
                    value={passwords[doctor._id]?.confirmPassword || ""}
                    onChange={(e) =>
                      handlePasswordChange(
                        doctor._id,
                        "confirmPassword",
                        e.target.value,
                      )
                    }
                    className="w-full rounded border bg-white px-2 py-1 pr-8 text-xs dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      togglePasswordVisibility(doctor._id, "confirmPassword")
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  >
                    {passwordVisibility[doctor._id]?.confirmPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </TableCell>
                <TableCell className="px-2 py-1 text-center">
                  <button
                    onClick={() => handleSubmit(doctor._id)}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                  >
                    Update
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
