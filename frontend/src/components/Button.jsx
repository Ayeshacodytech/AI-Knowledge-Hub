import { LoadingSpinner } from "./LoadingSpinner";
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-600/30 focus:ring-blue-500",
    secondary:
      "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500",
    ghost:
      "text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const isDisabled = loading || disabled;

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${
        sizes[size]
      } ${className} ${isDisabled ? "opacity-70 cursor-not-allowed" : ""}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
