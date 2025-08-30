"use client";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function PlannersList() {
  const [planners, setPlanners] = useState([]);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth) || {};
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlanners, setTotalPlanners] = useState(0);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasPlannerAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasPlannerAccess(!!data.user?.plannerAccess);
      } catch (err) {
        setHasPlannerAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  useEffect(() => {
    fetchPlanners();
  }, [currentPage]);

  const fetchPlanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/other-admins?role=planner&page=${currentPage}&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch planners");
      setPlanners(data.admins || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalPlanners(
        data.pagination?.totalAdmins || data.admins?.length || 0,
      );
    } catch (err) {
      toast.error(err.message || "Failed to fetch planners");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/other-admins/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetAdminId: deleteId }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || data.message || "Failed to delete planner",
        );
      toast.success("Planner deleted successfully!");
      fetchPlanners();
    } catch (err) {
      toast.error(err.message || "Failed to delete planner");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  if (hasPlannerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to View This Page.
        </span>
      </div>
    );
  }
  if (hasPlannerAccess === null) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h2 className="mb-4 text-2xl font-semibold text-blue-800 dark:text-white">
        All Planners
      </h2>
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[12px]">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
              >
                S.N.
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
              >
                Phone
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Delete
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : planners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  No planners found.
                </TableCell>
              </TableRow>
            ) : (
              planners.map((planner, idx) => (
                <TableRow
                  key={planner._id}
                  className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-10 items-center`}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 dark:text-blue-300">
                    {planner.name}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {planner.email}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {planner.phone || planner.mobile || "-"}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center">
                    <button
                      onClick={() => {
                        setDeleteId(planner._id);
                        setShowDeleteModal(true);
                      }}
                      className="p-1 text-red-600 transition-colors hover:text-red-800"
                      title="Delete Planner"
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalPlanners)} of {totalPlanners}{" "}
            planners
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Planner"
        message="Are you sure you want to delete this planner? This action cannot be undone."
        confirmButtonText={loading ? "Deleting..." : "Delete"}
        cancelButtonText="Cancel"
      />
    </div>
  );
}
