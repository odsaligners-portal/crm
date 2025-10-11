"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { setLoading } from "@/store/features/uiSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Editor } from "@tinymce/tinymce-react";
import { fetchWithError } from "@/utils/apiErrorHandler";

const PrivacyPolicyModal = ({
  isOpen,
  onClose,
  policy,
  mode = "create",
  onPolicySubmitted,
}) => {
  const [formData, setFormData] = useState({
    title: "Terms and Conditions",
    content: "",
    distributerId: "",
    version: "1.0",
    active: true,
  });
  const [distributers, setDistributers] = useState([]);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { isLoading: isSubmitting } = useSelector((state) => state.ui);

  // Fetch distributors when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchDistributers();
    }
  }, [isOpen, token]);

  const fetchDistributers = async () => {
    try {
      const result = await fetchWithError("/api/admin/distributers/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDistributers(result.distributers || []);
    } catch (err) {
      // fetchWithError handles toast
    }
  };

  useEffect(() => {
    if (mode === "edit" && policy) {
      setFormData({
        title: policy.title || "Terms and Conditions",
        content: policy.content || "",
        distributerId: policy.distributerId?._id || policy.distributerId || "",
        version: policy.version || "1.0",
        active: policy.active !== undefined ? policy.active : true,
      });
    } else if (mode === "create") {
      setFormData({
        title: "Terms and Conditions",
        content: "",
        distributerId: "",
        version: "1.0",
        active: true,
      });
    }
  }, [mode, policy, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditorChange = (content) => {
    setFormData({ ...formData, content });
  };

  const handleToggleActive = () => {
    setFormData({ ...formData, active: !formData.active });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.content || !formData.distributerId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    dispatch(setLoading(true));
    try {
      const url = "/api/privacy-policies";
      const method = mode === "edit" ? "PUT" : "POST";
      const body =
        mode === "edit"
          ? JSON.stringify({ id: policy._id, ...formData })
          : JSON.stringify(formData);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      let result = {};
      try {
        result = await response.json();
      } catch (jsonErr) {
        result = { message: response.statusText };
      }

      if (response.ok) {
        toast.success(
          mode === "edit"
            ? "Privacy policy updated successfully!"
            : "Privacy policy created successfully!",
        );
        if (onPolicySubmitted) {
          onPolicySubmitted();
        }
        onClose();
      } else {
        toast.error(
          result.message ||
            response.statusText ||
            `Failed to ${mode === "edit" ? "update" : "create"} terms and conditions`,
        );
      }
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen) return null;

  const isEditMode = mode === "edit";
  const modalTitle = isEditMode
    ? "Edit Terms and Conditions"
    : "Create Terms and Conditions";
  const submitButtonText = isEditMode
    ? "Update Terms & Conditions"
    : "Create Terms & Conditions";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      alignTop={true}
      showCloseButton={false}
    >
      <div className="relative flex max-h-[90vh] flex-col rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50">
        <div className="shrink-0 border-b border-gray-200 p-6 text-center dark:border-gray-700/50">
          <h2 className="text-2xl font-semibold subpixel-antialiased">
            {modalTitle}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-grow flex-col"
        >
          <div className="min-h-0 flex-grow overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="distributerId">Distributor *</Label>
                <select
                  id="distributerId"
                  name="distributerId"
                  value={formData.distributerId}
                  onChange={handleInputChange}
                  required
                  disabled={isEditMode} // Can't change distributor when editing
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
                >
                  <option value="">Select a distributor</option>
                  {distributers.map((distributor) => (
                    <option key={distributor._id} value={distributor._id}>
                      {distributor.name} ({distributor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Terms and Conditions"
                />
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  placeholder="e.g., 1.0, 2.1"
                />
              </div>

              <div>
                <Label htmlFor="content">Terms and Conditions Content *</Label>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                  value={formData.content}
                  onEditorChange={handleEditorChange}
                  init={{
                    height: 400,
                    menubar: true,
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
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | " +
                      "bold italic forecolor | alignleft aligncenter " +
                      "alignright alignjustify | bullist numlist outdent indent | " +
                      "removeformat | table | link image | help",
                    content_style:
                      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <div
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-300 ${formData.active ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formData.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-4 border-t border-gray-200 p-6 dark:border-gray-700/50">
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal;
