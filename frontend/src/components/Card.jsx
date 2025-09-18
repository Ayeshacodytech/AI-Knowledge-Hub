export const Card = ({ children, className = "", hover = false }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${
      hover
        ? "hover:shadow-lg hover:border-blue-200 transition-all duration-300"
        : ""
    } ${className}`}
  >
    {children}
  </div>
);
