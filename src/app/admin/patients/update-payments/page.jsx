"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import useDebounce from "@/hooks/useDebounce";

export default function UpdateMprActualPricePage() {
  const { token, role } = useSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [patient, setPatient] = useState(null);
  const [MRP, setMRP] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalPatient, setModalPatient] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const checkAccess = async () => {
      if (!token) return setHasAccess(false);
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (
          data.user &&
          (data.user.role === "super-admin" ||
            (data.user.role === "admin" && data.user.priceUpdateAccess))
        ) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch {
        setHasAccess(false);
      }
    };
    checkAccess();
  }, [token]);

  const fetchPatients = async (search = "") => {
    setLoading(true);
    try {
      let url = "/api/admin/patients/find";
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.patients) {
        setPatients(data.patients);
      } else if (res.ok && data.patient) {
        setPatients([data.patient]);
      } else {
        setPatients([]);
      }
    } catch (err) {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchPatients(debouncedSearchTerm);
    // eslint-disable-next-line
  }, [debouncedSearchTerm, hasAccess]);

  const openUpdateModal = (patient) => {
    setModalPatient(patient);
    setMRP(patient.MRP || "");
    setActualPrice(patient.actualPrice || "");
    setShowModal(true);
  };

  const handleModalUpdate = async () => {
    if (!modalPatient) return;
    // Validation
    if (!MRP || !actualPrice) {
      toast.error("Both MRP and Actual Price are required.");
      return;
    }
    if (isNaN(Number(MRP)) || Number(MRP) <= 0) {
      toast.error("MRP must be a positive number.");
      return;
    }
    if (isNaN(Number(actualPrice)) || Number(actualPrice) <= 0) {
      toast.error("Actual Price must be a positive number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/patients/update-mrp-actual-price?id=${modalPatient._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ MRP, actualPrice }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update prices");
      toast.success("Prices updated successfully!");
      setShowModal(false);
      setModalPatient(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.message || "Failed to update prices");
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-900">
          <h2 className="mb-2 text-2xl font-semibold text-red-600">
            Access Denied
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  if (hasAccess === null) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Update MRP & Actual Price
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            View and update MRP and actual price for approved patients.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Input
            type="text"
            placeholder="Search by Patient name or case ID..."
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
      <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <Table className="relative z-10 mx-auto w-full font-sans text-[11px]">
          <TableHeader className="rounded-t-xl border-b border-gray-100 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg dark:border-white/[0.05] dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
            <TableRow>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Case ID
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Patient Name
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Doctor Name
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Case Category
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Package
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                MRP
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Actual Price
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {patients.map((p, idx) => (
              <TableRow
                key={p._id || idx}
                className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300">
                  {p.caseId}
                </TableCell>
                <TableCell className="px-2 py-1 text-center font-medium">
                  {p.patientName}
                </TableCell>
                <TableCell className="px-2 py-1 text-center font-medium">
                  {p.userId?.name || "-"}
                </TableCell>
                <TableCell className="px-2 py-1 text-center font-medium">
                  {p.caseCategory || "-"}
                </TableCell>
                <TableCell className="px-2 py-1 text-center font-medium">
                  {p.selectedPrice || "-"}
                </TableCell>
                <TableCell className="px-2 py-1 text-center font-medium">
                  {p.MRP || "-"}
                </TableCell>
                <TableCell className="px-2 py-1 text-center font-medium">
                  {p.actualPrice || "-"}
                </TableCell>
                <TableCell className="px-2 py-1 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUpdateModal(p)}
                    className="px-2 py-1 text-[11px]"
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-[400px] p-5"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleModalUpdate();
          }}
        >
          <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Update MRP & Actual Price
          </h4>
          <div className="space-y-4">
            <Input
              label="MRP"
              value={MRP}
              onChange={(e) => setMRP(e.target.value)}
              placeholder="Enter MRP"
              className="w-full"
            />
            <Input
              label="Actual Price"
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              placeholder="Enter Actual Price"
              className="w-full"
            />
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
