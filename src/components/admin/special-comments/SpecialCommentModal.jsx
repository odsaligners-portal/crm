"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SelectField from "@/components/form/select/SelectField";
import { Editor } from "@tinymce/tinymce-react";
import { MdClose, MdPerson, MdDescription, MdSearch } from "react-icons/md";

export default function SpecialCommentModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  comment = null,
}) {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: "",
    comment: "",
    patientId: "",
  });

  const [patients, setPatients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [errors, setErrors] = useState({});

  // Populate form data when editing
  useEffect(() => {
    if (mode === "edit" && comment) {
      setFormData({
        title: comment.title || "",
        comment: comment.comment || "",
        patientId: comment.patientId?._id || comment.patientId || "",
      });
    } else {
      // Reset form for create mode
      setFormData({
        title: "",
        comment: "",
        patientId: "",
      });
    }
  }, [mode, comment, isOpen]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchInitialData();
    }
  }, [isOpen, token]);

  const fetchInitialData = async () => {
    dispatch(setLoading(true));
    try {
      // Fetch patients and admins in parallel
      const [patientsRes, adminsRes] = await Promise.all([
        fetchWithError("/api/admin/special-comments/patients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithError("/api/admin/special-comments/admins", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPatients(patientsRes.patients || []);
      setAdmins(adminsRes.admins || []);
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetchWithError(
        `/api/admin/special-comments/patients?search=${encodeURIComponent(searchTerm)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPatients(response.patients || []);
    } catch (error) {
      // fetchWithError handles toast
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.comment.trim()) {
      newErrors.comment = "Comment is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: "",
        comment: "",
        patientId: "",
      });
      setErrors({});
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      comment: "",
      patientId: "",
    });
    setErrors({});
    setPatientSearchTerm("");
    onClose();
  };

  const getPatientDisplayName = (patient) => {
    return `${patient.patientName} (${patient.caseId})`;
  };

  const isEditMode = mode === "edit";
  const modalTitle = isEditMode
    ? "Edit Special Comment"
    : "Create Special Comment";
  const submitButtonText = isEditMode ? "Update Comment" : "Create Comment";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="relative max-h-[90vh] overflow-auto p-6">
        {/* Header */}
        <div className="border-stroke dark:border-strokedark mb-6 flex items-center justify-between border-b pb-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            {modalTitle}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="mb-2 block">
              Comment Title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter comment title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="mb-2 block">
              Comment Content *
            </Label>
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
              value={formData.comment}
              onEditorChange={(content) =>
                handleInputChange("comment", content)
              }
              init={{
                height: 300,
                menubar: false,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "code",
                  "help",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              }}
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-500">{errors.comment}</p>
            )}
          </div>

          {/* Patient Selection */}
          <div>
            <Label htmlFor="patient" className="mb-2 block">
              Patient
            </Label>
            <SelectField
              value={formData.patientId}
              onChange={(e) => handleInputChange("patientId", e.target.value)}
              className="mt-2"
              options={[
                ...patients.map((patient) => ({
                  value: patient._id,
                  label: getPatientDisplayName(patient),
                })),
              ]}
            />
          </div>

          {/* Read By Section */}
          <div>
            <Label className="mb-2 block">Will be visible to:</Label>
            <div className="border-stroke dark:border-strokedark rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2">
                <MdPerson className="text-primary text-lg" />
                <span className="font-medium text-black dark:text-white">
                  All Administrators ({admins.length})
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {admins.map((admin) => (
                  <div
                    key={admin._id}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <span>•</span>
                    <span>{admin.name}</span>
                    <span className="text-xs text-gray-400">
                      ({admin.email})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-stroke dark:border-strokedark flex items-center justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">{submitButtonText}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
