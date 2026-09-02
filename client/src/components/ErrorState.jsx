import {
  AlertCircle,
  RefreshCw
} from "lucide-react";

const ErrorState = ({
  title = "Something went wrong",
  message = "We were unable to load the requested information.",
  onRetry
}) => {
  return (
    <div className="error-state">

      <div className="error-state-icon">
        <AlertCircle size={30} />
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          className="secondary-button"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}

    </div>
  );
};

export default ErrorState;
