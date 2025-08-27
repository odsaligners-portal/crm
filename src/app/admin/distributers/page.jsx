"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/tables/Pagination";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSelector } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function DistributersList() {
  const { token } = useSelector((state) => state.auth);
  const [hasDistributerAccess, setHasDistributerAccess] = useState(false);
  const [distributers, setDistributers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDistributers, setTotalDistributers] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasDistributerAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHasDistributerAccess(data.user?.distributerAccess);
      } catch (err) {
        setHasDistributerAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  useEffect(() => {
    fetchDistributers();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchDistributers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/distributers?page=${currentPage}&limit=10&search=${encodeURIComponent(search)}`,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || data.message || "Failed to fetch distributers",
        );
      setDistributers(data.distributers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalDistributers(
        data.pagination?.totalDistributers || data.distributers?.length || 0,
      );
    } catch (err) {
      toast.error(err.message || "Failed to fetch distributers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/distributers`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteId }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || data.message || "Failed to delete distributer",
        );
      toast.success("Distributer deleted successfully!");
      fetchDistributers();
    } catch (err) {
      toast.error(err.message || "Failed to delete distributer");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleAccessChange = async (id, newAccess) => {
    try {
      const res = await fetch(`/api/admin/distributers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, access: newAccess }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || data.message || "Failed to update access",
        );

      // Update access in local state
      setDistributers((prev) =>
        prev.map((d) => (d._id === id ? { ...d, access: newAccess } : d)),
      );

      toast.success("Access level updated");
    } catch (err) {
      toast.error(err.message || "Failed to update access");
    }
  };

  if (hasDistributerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-bold text-red-600 dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to View This Page.
        </span>
      </div>
    );
  }
  if (hasDistributerAccess === null) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h2 className="mb-4 text-2xl font-bold text-blue-800 dark:text-white">
        All Distributers
      </h2>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button onClick={fetchDistributers} className="h-10">
          Search
        </Button>
      </div>
      <div className="relative mx-auto w-full overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[12px]">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                S.N.
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                Mobile
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                City
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                State
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                Country
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                Access
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
              >
                Delete
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : distributers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center">
                  No distributers found.
                </TableCell>
              </TableRow>
            ) : (
              distributers.map((d, idx) => (
                <TableRow
                  key={d._id}
                  className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-10 items-center`}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300">
                    {(currentPage - 1) * 10 + idx + 1}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 dark:text-blue-300">
                    {d.name}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {d.email}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {d.mobile}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {d.city}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {d.state}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {d.country}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center">
                    <select
                      value={d.access || "view"}
                      onChange={(e) =>
                        handleAccessChange(d._id, e.target.value)
                      }
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                    >
                      <option value="view">View</option>
                      <option value="full">Full</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center">
                    <button
                      onClick={() => {
                        setDeleteId(d._id);
                        setShowDeleteModal(true);
                      }}
                      className="p-1 text-red-600 transition-colors hover:text-red-800"
                      title="Delete Distributer"
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
            {Math.min(currentPage * 10, totalDistributers)} of{" "}
            {totalDistributers} distributers
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
        title="Delete Distributer"
        message="Are you sure you want to delete this distributer? This action cannot be undone."
        confirmButtonText={loading ? "Deleting..." : "Delete"}
        cancelButtonText="Cancel"
      />
    </div>
  );
}
