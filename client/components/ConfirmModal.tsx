import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDangerous 
              ? "bg-red-100" 
              : "bg-blue-100"
          }`}>
            <AlertCircle className={`w-6 h-6 ${
              isDangerous 
                ? "text-red-600" 
                : "text-blue-600"
            }`} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition disabled:opacity-50 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg"
            }`}
          >
            {isLoading ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
