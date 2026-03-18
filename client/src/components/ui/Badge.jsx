const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    brand: "bg-brand-50 text-brand-800",
    success: "bg-teal-50 text-teal-800",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-coral-50 text-coral-800",
    info: "bg-blue-50 text-blue-800",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1",
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
