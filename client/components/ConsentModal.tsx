import React from "react";

export default function ConsentModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{description}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg">I Agree</button>
          <button onClick={onCancel} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}
