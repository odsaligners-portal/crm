"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaTrash } from 'react-icons/fa';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useRouter } from "next/navigation";
import { MdAdd, MdPlusOne } from "react-icons/md";

export default function OtherAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const { user, token } = useSelector((state) => state.auth) || {};
  const [currentUserId, setCurrentUserId] = useState(user?.id || null);
  const [superAdminId, setSuperAdminId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const res = await fetch("/api/user/profile?otherAdmins=true");
        const data = await res.json();
        setAdmins(data.admins || []);
      } catch (err) {
        setError("Failed to fetch admins");
      } finally {
        setLoading(false);
      }
    }
    fetchAdmins();
  }, []);

  useEffect(() => {
    // Try to get current user id and super admin id
    async function fetchCurrentUser() {
      if (!currentUserId) {
        try {
          const res = await fetch("/api/user/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          setCurrentUserId(data.user?.id);
        } catch {}
      }
      // Get super admin id from env (exposed via a public env variable or hardcode for now)
      setSuperAdminId(process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || "");
    }
    fetchCurrentUser();
  }, [user, currentUserId]);

  const isSuperAdmin = currentUserId && superAdminId && currentUserId === superAdminId;

  const handleAccessChange = async (adminId, field, value) => {
    const originalAdmins = [...admins];
    setUpdating((prev) => ({ ...prev, [adminId + field]: true }));
    const toastId = toast.loading("Updating access...");
    try {
      const res = await fetch("/api/admin/other-admins/update-access", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetAdminId: adminId,
          [field]: value === "Yes",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.message || "Failed to update access");
      }
      setAdmins((prev) =>
        prev.map((a) =>
          a._id === adminId || a.id === adminId ? { ...a, [field]: value === "Yes" } : a
        )
      );
      toast.dismiss(toastId);
      toast.success(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated to ${value}`);
    } catch (err) {
      setAdmins(originalAdmins); // revert to original
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to update access");
    } finally {
      setUpdating((prev) => ({ ...prev, [adminId + field]: false }));
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      const res = await fetch(`/api/admin/other-admins/delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetAdminId: adminToDelete._id || adminToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete admin');
      toast.success('Admin deleted successfully!');
      setAdmins((prev) => prev.filter((a) => a._id !== (adminToDelete._id || adminToDelete.id) && a.id !== (adminToDelete._id || adminToDelete.id)));
      setShowDeleteModal(false);
      setAdminToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete admin');
    }
  };

  if (loading) return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-brand-500"></div>
      </div>
    </div>
  );
  if (error) return <div>{error}</div>;

  if (!loading && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
            Other Admins
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
            List of all admins except the super admin
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => router.push('/admin/other-admins/create')}
            className="flex justify-center items-center px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform"
          >
            <MdAdd className="mr-2" />Create Admin
          </button>
        )}
      </div>
      <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />
      <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto max-w-4xl w-full backdrop-blur-md overflow-x-auto before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-gradient-to-r before:from-blue-200 before:via-purple-100 before:to-blue-100 before:animate-border-glow before:pointer-events-none">
        <Table className="min-w-full text-[10px] font-sans mx-auto relative z-10">
          {admins.length > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">S.N.</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Name</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Email</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">User Delete Access</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Event Update Access</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Comment Update Access</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Case Category Update Access</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin, idx) => (
                  <TableRow
                    key={admin._id || admin.id}
                    className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp h-7 items-center text-[10px]`}
                    style={{ fontFamily: 'Inter, sans-serif', animationDelay: `${idx * 30}ms` }}
                  >
                    <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-0.5 px-1">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-blue-600 dark:text-blue-300 text-center py-0.5 px-1">{admin.name}</TableCell>
                    <TableCell className="font-medium text-center py-0.5 px-1">{admin.email}</TableCell>
                    <TableCell className="p-2 border text-center">
                      <select
                        value={admin.userDeleteAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin || updating[(admin._id || admin.id) + "userDeleteAccess"]}
                        onChange={e => handleAccessChange(admin._id || admin.id, "userDeleteAccess", e.target.value)}
                        className="rounded border px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      <select
                        value={admin.eventUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin || updating[(admin._id || admin.id) + "eventUpdateAccess"]}
                        onChange={e => handleAccessChange(admin._id || admin.id, "eventUpdateAccess", e.target.value)}
                        className="rounded border px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      <select
                        value={admin.commentUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin || updating[(admin._id || admin.id) + "commentUpdateAccess"]}
                        onChange={e => handleAccessChange(admin._id || admin.id, "commentUpdateAccess", e.target.value)}
                        className="rounded border px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      <select
                        value={admin.caseCategoryUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin || updating[(admin._id || admin.id) + "caseCategoryUpdateAccess"]}
                        onChange={e => handleAccessChange(admin._id || admin.id, "caseCategoryUpdateAccess", e.target.value)}
                        className="rounded border px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="p-2 border text-center">
                      {isSuperAdmin && (
                        <button
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                          title="Delete Admin"
                          onClick={() => {
                            setAdminToDelete(admin);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </>
          )}
        </Table>
        {admins.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="120" height="120" fill="none" className="mb-6 opacity-60" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" stroke="#3b82f6" strokeWidth="4" fill="#e0e7ff" /><path d="M40 80c0-11 9-20 20-20s20 9 20 20" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" /><circle cx="60" cy="54" r="10" fill="#6366f1" /></svg>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">No admins found</div>
            <div className="text-gray-500 mb-6">No other admins exist except the super admin.</div>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setAdminToDelete(null); }}
        onConfirm={handleDeleteAdmin}
        title="Delete Admin"
        message={adminToDelete ? `Are you sure you want to delete admin '${adminToDelete.name}'? This action cannot be undone.` : ''}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
}
