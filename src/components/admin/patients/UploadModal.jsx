"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { UserIcon, PencilSquareIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Editor } from '@tinymce/tinymce-react';
import { useSelector } from "react-redux";

const UploadModal = ({ isOpen, onClose, patient }) => {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // Key to force re-render
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      setDescription("");
      setEditorKey(prevKey => prevKey + 1); // Change key to re-mount the editor
    }
  }, [isOpen, patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    
    try {
        const response = await fetch(`/api/patients/comments?patientId=${patient._id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comment: description }),
        });

        if (response.ok) {
            toast.success('Comment added successfully!');
            onClose();
        } else {
            const errorData = await response.json();
            toast.error(errorData.message || 'Failed to add comment.');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        toast.error('An error occurred while submitting the comment.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl w-full p-1"
      showCloseButton={false}
    >
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20">
        {/* Subtle SVG pattern background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="modal-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#3b82f6" /></pattern></defs><rect width="100%" height="100%" fill="url(#modal-dots)" /></svg>
        
        <div className="p-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
              Add Comment
            </h2>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
              For patient: <span className="font-bold text-purple-600 dark:text-purple-400">{patient?.patientName}</span>
            </p>
          </div>

          {patient && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">
                  Patient Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={patient.patientName}
                    disabled
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 py-3 pl-11 pr-4 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <div className="relative">
                   <PencilSquareIcon className="absolute left-4 top-5 h-5 w-5 text-gray-400" />
                  <Editor
                    key={editorKey}
                    apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY} // Replace with your free API key from tiny.cloud
                    initialValue=""
                    init={{
                      height: 250,
                      menubar: false,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                      content_style: 'body { font-family:Inter,sans-serif; font-size:14px }',
                      skin: (document.documentElement.classList.contains('dark') ? "oxide-dark" : "oxide"),
                      content_css: (document.documentElement.classList.contains('dark') ? "dark" : "default"),
                    }}
                    onEditorChange={(content, editor) => setDescription(content)}
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !description.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
