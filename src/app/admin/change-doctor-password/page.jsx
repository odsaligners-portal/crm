"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import useDebounce from '@/hooks/useDebounce';
import { useRouter } from "next/navigation";
import { MdLockOutline } from 'react-icons/md';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ChangeDoctorPasswordPage() {
  const [doctors, setDoctors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [passwords, setPasswords] = useState({});
  const [adminPasswords, setAdminPasswords] = useState({});
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { token } = useSelector((state) => state.auth) || {};
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const togglePasswordVisibility = (userId, field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: !prev[userId]?.[field],
      },
    }));
  };

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch access rights');
        }
        setHasAccess(data.user.changeDoctorPasswordAccess);
        const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
        if (data.user.id === superAdminId) {
          setIsSuperAdmin(true);
        }
      } catch (err) {
        toast.error(err.message || "Could not verify access rights.");
        setHasAccess(false);
      }
    };

    if (token) {
      fetchAccess();
    } else if (token === null) {
      setHasAccess(false);
    }
  }, [token]);

  useEffect(() => {
    async function fetchUsers() {
      if (!loading) {
        setIsSearching(true);
      }
      try {
        // Fetch doctors
        const doctorUrl = new URL('/api/user/profile?role=doctor', window.location.origin);
        if (debouncedSearchTerm) {
          doctorUrl.searchParams.append('search', debouncedSearchTerm);
        }
        const doctorRes = await fetch(doctorUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const doctorData = await doctorRes.json();
        if (!doctorRes.ok) throw new Error(doctorData.message || "Failed to fetch doctors");
        setDoctors(doctorData.doctors || []);

        // Fetch other admins if super admin
        if (isSuperAdmin) {
          const adminUrl = new URL('/api/user/profile?otherAdmins=true', window.location.origin);
          if (debouncedSearchTerm) {
            adminUrl.searchParams.append('search', debouncedSearchTerm);
          }
          const adminRes = await fetch(adminUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const adminData = await adminRes.json();
          if (!adminRes.ok) throw new Error(adminData.message || "Failed to fetch admins");
          setAdmins(adminData.admins || []);
        }
      } catch (err) {
        toast.error(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }
    if (token && hasAccess) {
      fetchUsers();
    } else if (hasAccess === false) {
      setLoading(false);
    }
  }, [token, debouncedSearchTerm, hasAccess, loading, isSuperAdmin]);

  const handlePasswordChange = (userId, field, value, userType = 'doctor') => {
    const setPasswordsState = userType === 'admin' ? setAdminPasswords : setPasswords;
    setPasswordsState(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (userId, userType = 'doctor') => {
    const { password, confirmPassword } = userType === 'admin' ? adminPasswords[userId] : passwords[userId] || {};
    if (!password || !confirmPassword) {
      return toast.error("Password and confirm password are required.");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setUpdating((prev) => ({ ...prev, [userId]: true }));
    const toastId = toast.loading("Updating password...");

    try {
      const res = await fetch("/api/admin/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");

      toast.dismiss(toastId);
      toast.success("Password updated successfully");
      const setPasswordsState = userType === 'admin' ? setAdminPasswords : setPasswords;
      setPasswordsState(prev => ({ ...prev, [userId]: { password: '', confirmPassword: '' } }));
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to update password");
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (loading || hasAccess === null) return (
    <div className="p-5 lg:p-6 flex items-center justify-center h-64">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-brand-500"></div>
    </div>
  );

  if (hasAccess === false) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white-50 to-blue-100 dark:from-gray-900 dark:to-white-900/50 p-4">
            <div className="relative w-full max-w-md p-8 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 ease-in-out border-2 border-red-200 dark:border-red-700">
                <div className="absolute top-4 right-4 text-red-400 dark:text-red-500">
                    <MdLockOutline size={24} />
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full inline-block mb-4 border-4 border-white dark:border-gray-800 shadow-lg">
                    <MdLockOutline size={40} className="text-red-500 dark:text-red-300" />
                </div>
                <h1 className="text-2xl font-extrabold text-red-700 dark:text-red-300 tracking-tight drop-shadow-sm mb-2">
                    Access Denied
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                    You do not have the necessary permissions to access this page.
                </p>
                <button
                    onClick={() => router.back()}
                    className="mt-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform hover:translate-y-px transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      {isSuperAdmin && (
        <div className="mb-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
                Admin Passwords
              </h1>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
                Update passwords for admin accounts
              </p>
            </div>
          </div>
          <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />
          <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto w-full backdrop-blur-md overflow-x-auto">
            <Table className="min-w-full text-xs font-sans mx-auto relative z-10">
              <TableHeader>
                <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">S.N.</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Name</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Email</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Password</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Confirm Password</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3 text-center">Action</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin, idx) => (
                  <TableRow
                    key={admin._id}
                    className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-1 px-2">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-blue-600 dark:text-blue-300 py-1 px-2">{admin.name}</TableCell>
                    <TableCell className="font-medium py-1 px-2">{admin.email}</TableCell>
                    <TableCell className="py-1 px-2 relative">
                      <input
                        type={passwordVisibility[admin._id]?.password ? "text" : "password"}
                        value={adminPasswords[admin._id]?.password || ''}
                        onChange={(e) => handlePasswordChange(admin._id, 'password', e.target.value, 'admin')}
                        className="w-full rounded border px-2 py-1 bg-white dark:bg-gray-800 text-xs pr-8"
                        disabled={updating[admin._id]}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(admin._id, 'password')}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      >
                        {passwordVisibility[admin._id]?.password ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </TableCell>
                    <TableCell className="py-1 px-2 relative">
                      <input
                        type={passwordVisibility[admin._id]?.confirmPassword ? "text" : "password"}
                        value={adminPasswords[admin._id]?.confirmPassword || ''}
                        onChange={(e) => handlePasswordChange(admin._id, 'confirmPassword', e.target.value, 'admin')}
                        className="w-full rounded border px-2 py-1 bg-white dark:bg-gray-800 text-xs pr-8"
                        disabled={updating[admin._id]}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(admin._id, 'confirmPassword')}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      >
                        {passwordVisibility[admin._id]?.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </TableCell>
                    <TableCell className="py-1 px-2 text-center">
                      <button
                        onClick={() => handleSubmit(admin._id, 'admin')}
                        disabled={updating[admin._id]}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded disabled:bg-gray-400 text-xs"
                      >
                        {updating[admin._id] ? 'Updating...' : 'Submit'}
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
          <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
            Change Doctor's Password
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
            Update passwords for doctor accounts
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />
      <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto w-full backdrop-blur-md overflow-x-auto">
        {isSearching && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl">
            <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-brand-500"></div>
          </div>
        )}
        <Table className="min-w-full text-xs font-sans mx-auto relative z-10">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">S.N.</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Name</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Email</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Password</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3">Confirm Password</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-2 px-3 text-center">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor, idx) => (
              <TableRow
                key={doctor._id}
                className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-1 px-2">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-blue-600 dark:text-blue-300 py-1 px-2">{doctor.name}</TableCell>
                <TableCell className="font-medium py-1 px-2">{doctor.email}</TableCell>
                <TableCell className="py-1 px-2 relative">
                  <input
                    type={passwordVisibility[doctor._id]?.password ? "text" : "password"}
                    value={passwords[doctor._id]?.password || ''}
                    onChange={(e) => handlePasswordChange(doctor._id, 'password', e.target.value)}
                    className="w-full rounded border px-2 py-1 bg-white dark:bg-gray-800 text-xs pr-8"
                    disabled={updating[doctor._id]}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(doctor._id, 'password')}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  >
                    {passwordVisibility[doctor._id]?.password ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </TableCell>
                <TableCell className="py-1 px-2 relative">
                  <input
                    type={passwordVisibility[doctor._id]?.confirmPassword ? "text" : "password"}
                    value={passwords[doctor._id]?.confirmPassword || ''}
                    onChange={(e) => handlePasswordChange(doctor._id, 'confirmPassword', e.target.value)}
                    className="w-full rounded border px-2 py-1 bg-white dark:bg-gray-800 text-xs pr-8"
                    disabled={updating[doctor._id]}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(doctor._id, 'confirmPassword')}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  >
                    {passwordVisibility[doctor._id]?.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </TableCell>
                <TableCell className="py-1 px-2 text-center">
                  <button
                    onClick={() => handleSubmit(doctor._id)}
                    disabled={updating[doctor._id]}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded disabled:bg-gray-400 text-xs"
                  >
                    {updating[doctor._id] ? 'Updating...' : 'Submit'}
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