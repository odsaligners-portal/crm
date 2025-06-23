"use client";
import React from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="p-6 sm:p-8">
        <div className="flex items-start space-x-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse sm:gap-4">
          <Button
            onClick={onConfirm}
            variant='danger'
            className="w-full sm:w-auto"
          >
            {confirmButtonText}
          </Button>
          <Button
            onClick={onClose}
            variant='secondary'
            className="mt-3 w-full sm:mt-0 sm:w-auto"
          >
            {cancelButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal; 