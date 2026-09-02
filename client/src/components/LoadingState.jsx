import { LoaderCircle } from "lucide-react";

const LoadingState = ({
  message = "Loading..."
}) => {
  return (
    <div className="loading-state">
      <LoaderCircle
        size={30}
        className="loading-spinner"
      />

      <p>
        {message}
      </p>
    </div>
  );
};

export default LoadingState;