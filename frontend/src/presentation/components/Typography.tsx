import React from 'react';
import { Text, TextProps } from 'react-native';

export const Heading = ({ children, className, ...props }: TextProps) => (
  <Text 
    className={`text-white font-inter-bold text-xl ${className}`} 
    {...props}
  >
    {children}
  </Text>
);

export const SubHeading = ({ children, className, ...props }: TextProps) => (
  <Text 
    className={`text-white font-inter-bold text-lg ${className}`} 
    {...props}
  >
    {children}
  </Text>
);

export const FormLabel = ({ children, className, ...props }: TextProps) => (
  <Text 
    className={`text-cyan-400 font-plex text-xs uppercase tracking-wider ${className}`} 
    {...props}
  >
    {children}
  </Text>
);

export const FinancialFigure = ({ children, className, ...props }: TextProps) => (
  <Text 
    className={`text-white font-mono-medium text-base ${className}`} 
    {...props}
  >
    {children}
  </Text>
);

export const BodyText = ({ children, className, ...props }: TextProps) => (
  <Text 
    className={`text-white/60 font-inter text-sm leading-relaxed ${className}`} 
    {...props}
  >
    {children}
  </Text>
);
