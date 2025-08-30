"use client";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { MdAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function OtherAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState(null);
  const { user, token } = useSelector((state) => state.auth) || {};
  const [currentUserId, setCurrentUserId] = useState(user?.id || null);
  const [superAdminId, setSuperAdminId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchAdmins() {
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/user/profile?otherAdmins=true");
        setAdmins(data.admins || []);
      } catch (err) {
        setError("Failed to fetch admins");
      } finally {
        dispatch(setLoading(false));
      }
    }
    fetchAdmins();
  }, [dispatch]);

  useEffect(() => {
    // Try to get current user id and super admin id
    async function fetchCurrentUser() {
      dispatch(setLoading(true));
      if (!currentUserId) {
        try {
          const data = await fetchWithError("/api/user/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setCurrentUserId(data.user?.id);
        } catch {
          // ignore error
        }
      }
      // Get super admin id from env (exposed via a public env variable or hardcode for now)
      setSuperAdminId(process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || "");
      dispatch(setLoading(false));
    }
    fetchCurrentUser();
  }, [user, currentUserId, token, dispatch]);

  const isSuperAdmin =
    currentUserId && superAdminId && currentUserId === superAdminId;

  const handleAccessChange = async (adminId, field, value) => {
    dispatch(setLoading(true));
    try {
      await fetchWithError("/api/admin/other-admins/update-access", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetAdminId: adminId,
          [field]: value === "Yes",
        }),
      });
      setAdmins((prev) =>
        prev.map((a) =>
          a._id === adminId || a.id === adminId
            ? { ...a, [field]: value === "Yes" }
            : a,
        ),
      );
      toast.success(
        `${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} updated to ${value}`,
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/admin/other-admins/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetAdminId: adminToDelete._id || adminToDelete.id,
        }),
      });
      toast.success("Admin deleted successfully!");
      setAdmins((prev) =>
        prev.filter(
          (a) =>
            a._id !== (adminToDelete._id || adminToDelete.id) &&
            a.id !== (adminToDelete._id || adminToDelete.id),
        ),
      );
      setShowDeleteModal(false);
      setAdminToDelete(null);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (error) return <div>{error}</div>;

  if (!isSuperAdmin && admins.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-900">
          <h2 className="mb-2 text-2xl font-semibold text-red-600 subpixel-antialiased">
            Access Denied
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Other Admins
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            List of all admins except the super admin
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => router.push("/admin/other-admins/create")}
            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-4 py-2 font-semibold text-white subpixel-antialiased shadow-md transition-transform hover:scale-105"
          >
            <MdAdd className="mr-2" />
            Create Admin
          </button>
        )}
      </div>
      <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />
      <div className="before:border-gradient-to-r before:animate-border-glow max-w-auto relative mx-auto w-full overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[10px]">
          {admins.length > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    S.N.
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Patient Delete Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Event Update Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Comment Update Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Case Category Update Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Change Doctor Password Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Price Update Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    A/C Team Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Distributer Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Planner Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Production Comment Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin, idx) => (
                  <TableRow
                    key={admin._id || admin.id}
                    className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-7 items-center text-[10px]`}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      animationDelay: `${idx * 30}ms`,
                    }}
                  >
                    <TableCell className="px-1 py-0.5 text-center font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                      {admin.name}
                    </TableCell>
                    <TableCell className="px-1 py-0.5 text-center font-medium">
                      {admin.email}
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.userDeleteAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "userDeleteAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.eventUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "eventUpdateAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.commentUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "commentUpdateAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.caseCategoryUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "caseCategoryUpdateAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.changeDoctorPasswordAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "changeDoctorPasswordAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.priceUpdateAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "priceUpdateAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.addSalesPersonAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "addSalesPersonAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.distributerAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "distributerAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.plannerAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "plannerAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      <select
                        value={admin.specialCommentAccess ? "Yes" : "No"}
                        disabled={!isSuperAdmin}
                        onChange={(e) =>
                          handleAccessChange(
                            admin._id || admin.id,
                            "specialCommentAccess",
                            e.target.value,
                          )
                        }
                        className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell className="border p-2 text-center">
                      {isSuperAdmin && (
                        <button
                          className="text-xs font-semibold text-red-500 subpixel-antialiased hover:text-red-700"
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
        {admins.length === 0 && !isSuperAdmin && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg
              width="120"
              height="120"
              fill="none"
              className="mb-6 opacity-60"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                r="56"
                stroke="#3b82f6"
                strokeWidth="4"
                fill="#e0e7ff"
              />
              <path
                d="M40 80c0-11 9-20 20-20s20 9 20 20"
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="60" cy="54" r="10" fill="#6366f1" />
            </svg>
            <div className="mb-2 text-2xl font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200">
              No admins found
            </div>
            <div className="mb-6 text-gray-500">
              No other admins exist except the super admin.
            </div>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleDeleteAdmin}
        title="Delete Admin"
        message={
          adminToDelete
            ? `Are you sure you want to delete admin '${adminToDelete.name}'? This action cannot be undone.`
            : ""
        }
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
}
