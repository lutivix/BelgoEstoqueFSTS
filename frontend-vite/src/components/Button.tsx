import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'base' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'base',
  children,
  className,
  ...props
}) => {
  // Base styles
  let baseClasses = 'font-sans font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    base: 'px-4 py-2 text-base', // Using spacing-4 and spacing-2 (16px, 8px) approx
    lg: 'px-6 py-3 text-lg',   // Using spacing-6 and spacing-3 (24px, 12px) approx
  };

  // Variant styles
  const variantClasses = {
    primary: 'bg-primary text-text-button hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-neutral-200 text-text-body hover:bg-neutral-300 focus:ring-neutral-400',
    success: 'bg-success text-text-button hover:bg-success-hover focus:ring-success',
    warning: 'bg-warning text-text-button hover:bg-warning-hover focus:ring-warning',
    danger: 'bg-danger text-text-button hover:bg-danger-hover focus:ring-danger',
    // Add other variants if needed (e.g., outline)
  };

  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className || ''}
  `;

  return (
    <button className={combinedClasses.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;

