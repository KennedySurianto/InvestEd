import { useState, useEffect } from 'react';

type ToastProps = {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'default';
  onClose: () => void;
};

export const CustomToast = ({ title, description, type, onClose }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // When the component is about to be unmounted via timeout, trigger exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4700); // Start exit animation slightly before it's removed

    return () => clearTimeout(exitTimer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Allow time for the exit animation before calling onClose
    setTimeout(onClose, 300);
  };

  return (
    <div className={`toast toast-${type} ${isExiting ? 'exit' : 'enter'}`}>
      <div className="toast-content">
        <p className="toast-title">{title}</p>
        {description && <p className="toast-description">{description}</p>}
      </div>
      <button onClick={handleClose} className="toast-close-button">
        &times;
      </button>
    </div>
  );
};