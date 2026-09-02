import {
  Inbox
} from "lucide-react";

const EmptyState = ({
  title = "Nothing to show",
  message = "There are no records available."
}) => {
  return (
    <div className="empty-state">

      <div className="empty-state-icon">
        <Inbox size={30} />
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {message}
      </p>

    </div>
  );
};

export default EmptyState;