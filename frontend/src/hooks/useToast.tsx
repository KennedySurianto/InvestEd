import { createContext, useState, useContext, type ReactNode } from 'react';
import { CustomToast } from '@/components/ui/custom-toast'; // We will create this next

// Define the shape/type of a single toast message
type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'default';
};

// Define the function that components will call to show a toast
type ToastContextType = {
  showToast: (options: Omit<ToastMessage, 'id'>) => void;
};

// Create the React Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// The provider component that will wrap your app
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const showToast = ({ title, description, type }: Omit<ToastMessage, 'id'>) => {
    const id = Date.now();
    const newToast: ToastMessage = { id, title, description, type };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Set a timer to automatically remove the toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* This is the container where all toasts will be rendered */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <CustomToast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// The custom hook that components will use to access the showToast function
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};