import React from 'react';

export const FiIcon = ({ name, className = '', size, style }: { name: string; className?: string; size?: number; style?: React.CSSProperties }) => (
  <i className={`fi fi-br-${name} ${className}`} style={{ ...style, fontSize: size || style?.fontSize }} />
);
