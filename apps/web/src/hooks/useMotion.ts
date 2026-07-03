import { useReducedMotion } from 'framer-motion';

export function useMotion(config?: { initial?: any; animate?: any; transition?: any }) {
  const shouldReduce = useReducedMotion();
  
  return {
    initial: shouldReduce ? {} : (config?.initial || { opacity: 0, y: 20 }),
    animate: config?.animate || { opacity: 1, y: 0 },
    transition: shouldReduce ? { duration: 0 } : (config?.transition || { duration: 0.4 }),
  };
}
