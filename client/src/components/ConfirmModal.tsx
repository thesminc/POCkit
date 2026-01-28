interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "primary" | "warning" | "danger";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "primary",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    primary: "bg-protocol-primary hover:bg-protocol-primary-hover",
    warning: "bg-protocol-warning hover:bg-yellow-600",
    danger: "bg-protocol-error hover:bg-red-700",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-protocol-card border border-protocol-border rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Title */}
          <h3 className="text-xl font-semibold text-protocol-text-primary mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-protocol-text-secondary mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-protocol-darker text-protocol-text-primary rounded-lg hover:bg-protocol-border transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
