import React from "react";

interface ErrorListProps {
  errors?: string[] | null;
  centered?: boolean;
  className?: string;
}

export const ErrorRender: React.FC<ErrorListProps> = ({
  errors,
  centered = false,
  className = "",
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <ul
      className={`text-red-500 text-sm space-y-1 ${
        centered ? "text-center" : "text-left"
      } ${className}`}
    >
      {errors.map((error, index) => (
        <li key={index}>
          • {error}
        </li>
      ))}
    </ul>
  );
};
