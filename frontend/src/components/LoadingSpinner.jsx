import { Loader } from "lucide-react";
export const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Loader className={`${sizeClasses[size]} animate-spin text-blue-600`} />
  );
};
