import { AlertCircle } from "lucide-react";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
export const ConnectionStatus = () => {
  const { isConnected, isChecking } = useConnectionStatus();

  if (isChecking) return null;

  if (!isConnected) {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <AlertCircle size={16} />
        <span className="text-sm">Backend disconnected</span>
      </div>
    );
  }

  return null;
};