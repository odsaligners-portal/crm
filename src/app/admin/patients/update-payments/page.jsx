"use client"
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
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
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.user && (data.user.role === 'super-admin' || (data.user.role === 'admin' && data.user.priceUpdateAccess))) {
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
      toast.error('Both MRP and Actual Price are required.');
      return;
    }
    if (isNaN(Number(MRP)) || Number(MRP) <= 0) {
      toast.error('MRP must be a positive number.');
      return;
    }
    if (isNaN(Number(actualPrice)) || Number(actualPrice) <= 0) {
      toast.error('Actual Price must be a positive number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/patients/update-mrp-actual-price?id=${modalPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ MRP, actualPrice }),
      });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  if (hasAccess === null) {
    return null;
  }

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">Update MRP & Actual Price</h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">View and update MRP and actual price for approved patients.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Input
            type="text"
            placeholder="Search by Patient name or case ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mt-2">
        <Table className="text-[11px] font-sans mx-auto relative z-10 w-full">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl">
            <TableRow>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Case ID</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Patient Name</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Doctor Name</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Case Category</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Package</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">MRP</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Actual Price</TableCell>
              <TableCell isHeader className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200 text-center">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {patients.map((p, idx) => (
              <TableRow key={p._id || idx} className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp`} style={{ animationDelay: `${idx * 30}ms` }}>
                <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-1 px-2">{p.caseId}</TableCell>
                <TableCell className="font-medium text-center py-1 px-2">{p.patientName}</TableCell>
                <TableCell className="font-medium text-center py-1 px-2">{p.userId?.name || '-'}</TableCell>
                <TableCell className="font-medium text-center py-1 px-2">{p.caseCategory || '-'}</TableCell>
                <TableCell className="font-medium text-center py-1 px-2">{p.selectedPrice || '-'}</TableCell>
                <TableCell className="font-medium text-center py-1 px-2">{p.MRP || '-'}</TableCell>
                <TableCell className="font-medium text-center py-1 px-2">{p.actualPrice || '-'}</TableCell>
                <TableCell className="text-center py-1 px-2">
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-[400px] p-5">
        <form onSubmit={e => { e.preventDefault(); handleModalUpdate(); }}>
          <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Update MRP & Actual Price</h4>
          <div className="space-y-4">
            <Input
              label="MRP"
              value={MRP}
              onChange={e => setMRP(e.target.value)}
              placeholder="Enter MRP"
              className="w-full"
            />
            <Input
              label="Actual Price"
              value={actualPrice}
              onChange={e => setActualPrice(e.target.value)}
              placeholder="Enter Actual Price"
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowModal(false)} type="button">
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