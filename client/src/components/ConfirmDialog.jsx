import {
  AlertTriangle,
  X
} from "lucide-react";

const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false
}) => {

  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-dialog-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >

      <div className="confirm-dialog">

        <button
          type="button"
          className="confirm-dialog-close"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
        >
          <X size={18} />
        </button>


        <div className="confirm-dialog-icon">
          <AlertTriangle size={26} />
        </div>


        <h2>
          {title}
        </h2>


        <p>
          {message}
        </p>


        <div className="confirm-dialog-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>


          <button
            type="button"
            className="danger-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : confirmText}
          </button>

        </div>

      </div>

    </div>
  );
};

export default ConfirmDialog;
