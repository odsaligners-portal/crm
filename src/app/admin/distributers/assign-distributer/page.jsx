"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import { useSelector } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function AssignDistributer() {
  const { token } = useSelector((state) => state.auth);
  const [hasDistributerAccess, setHasDistributerAccess] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [distributers, setDistributers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [search, setSearch] = useState("");
  const [filterNoDistrubuter, setFilterNoDistrubuter] = useState(false);
  const [rowLoading, setRowLoading] = useState({});

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
    setCurrentPage(1);
  }, [search, filterNoDistrubuter]);

  useEffect(() => {
    fetchDoctors();
  }, [currentPage]);

  useEffect(() => {
    fetchDistributers();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/other-admins?role=doctor&page=${currentPage}&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch doctors");
      setDoctors(data.admins || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalDoctors(data.pagination?.totalAdmins || data.admins?.length || 0);
    } catch (err) {
      toast.error(err.message || "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributers = async () => {
    try {
      const res = await fetch(`/api/admin/distributers?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setDistributers(data.distributers || []);
    } catch (err) {
      toast.error("Failed to fetch distributers");
    }
  };

  const handleAssignmentChange = async (doctorId, distributerId, access) => {
    if (distributerId === "") {
      toast.error("Please select a distributer");
      return;
    }
    setRowLoading((prev) => ({ ...prev, [doctorId]: true }));

    try {
      const res = await fetch(`/api/admin/distributers/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId, distributerId, access }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update assignment");

      toast.success("Distributer assignment updated!");

      setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc._id === doctorId
            ? { ...doc, distributerId, distributerAccess: access }
            : doc,
        ),
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRowLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const filteredDoctors = doctors.filter(
    (p) =>
      (!filterNoDistrubuter ||
        !p.distributerId ||
        p.distributerId === "" ||
        p.distributerId === null) &&
      (!search || p.name?.toLowerCase().includes(search.toLowerCase())),
  );

  if (hasDistributerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 subpixel-antialiased dark:text-red-400">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Assign Distributer to Doctors
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            Assign distributers to doctors and manage assignments
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex w-auto gap-2">
          <Input
            placeholder="Search by doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
          <Button onClick={fetchDoctors} className="h-full">
            Search
          </Button>
        </div>
        <div className="h-full items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterNoDistrubuter}
              onChange={(e) => setFilterNoDistrubuter(e.target.checked)}
            />
            <span className="text-sm">
              Show only doctors with no distributer
            </span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full max-w-6xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 sm:overflow-x-visible dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[10px]">
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
                Mobile
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Distributer
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Access
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  No doctors found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDoctors.map((doctor, idx) => (
                <TableRow
                  key={doctor._id}
                  className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-10 items-center`}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                    {(currentPage - 1) * 10 + idx + 1}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                    {doctor.name}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {doctor.email}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {doctor.mobile}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    <select
                      value={doctor.distributerId || ""}
                      onChange={(e) =>
                        handleAssignmentChange(
                          doctor._id,
                          e.target.value,
                          doctor.distributerAccess || "view",
                        )
                      }
                      disabled={rowLoading[doctor._id]}
                      className="w-32 rounded border px-2 py-1"
                    >
                      <option value="">Select Distributer</option>
                      {distributers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    <select
                      value={doctor.distributerAccess || "view"}
                      onChange={(e) =>
                        handleAssignmentChange(
                          doctor._id,
                          doctor.distributerId,
                          e.target.value,
                        )
                      }
                      disabled={rowLoading[doctor._id]}
                      className="w-24 rounded border px-2 py-1"
                    >
                      <option value="view">View</option>
                      <option value="update">Update</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center">
                    {rowLoading[doctor._id] && (
                      <span className="text-xs text-blue-500">Saving...</span>
                    )}
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
            {Math.min(currentPage * 10, filteredDoctors.length)} of{" "}
            {filteredDoctors.length} doctors
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
