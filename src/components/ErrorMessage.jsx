
import "./ErrorMessage.css";

function ErrorMessage({
  message = "Something went wrong. Please try again.",
  onRetry,
}) {
  return (
    <div className="error-message">
      <div className="error-message-icon">!</div>

      <div className="error-message-content">
        <h3>Something went wrong</h3>

        <p>{message}</p>

        {onRetry && (
          <button
            type="button"
            className="error-message-retry"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
