import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = '#3b82f6',
  speed = '4s',
  thickness = 3,
  children,
  style,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      style={{
        padding: `${thickness}px`,
        ...style,
      }}
      {...rest}
    >
      {/* Continuous spinning border beam */}
      <div
        className="absolute inset-0 rounded-[20px] animate-spin z-0"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${color} 8%, transparent 16%, transparent 42%, ${color} 50%, transparent 58%, transparent 100%)`,
          animationDuration: speed,
          animationTimingFunction: 'linear',
        }}
      />
      <div className="relative z-1 text-white rounded-[20px]">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
