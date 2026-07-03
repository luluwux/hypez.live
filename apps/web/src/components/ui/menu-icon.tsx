"use client";

import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface MenuIconProps {
    isOpen: boolean;
    color?: string;
    size?: number;
    strokeWidth?: number;
    className?: string; // Add className prop
}

export function MenuIcon({
    isOpen,
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    className
}: MenuIconProps) {
    const animations: Record<string, Variants> = {
        line1: {
            initial: {
                rotate: 0,
                x: 0,
                y: 0,
            },
            animate: {
                rotate: -45,
                x: -2.35,
                y: 0.35,
                transformOrigin: 'top right',
                transition: {
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                },
            },
            closed: {
                rotate: 0,
                x: 0,
                y: 0,
                transition: {
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                }
            }
        },
        line2: {
            initial: {
                opacity: 1,
            },
            animate: {
                opacity: 0,
                transition: {
                    ease: 'easeInOut',
                    duration: 0.2,
                },
            },
            closed: {
                opacity: 1,
                transition: {
                    ease: 'easeInOut',
                    duration: 0.2,
                }
            }
        },
        line3: {
            initial: {
                rotate: 0,
                x: 0,
                y: 0,
            },
            animate: {
                rotate: 45,
                x: -2.35,
                y: -0.35,
                transformOrigin: 'bottom right',
                transition: {
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                },
            },
            closed: {
                rotate: 0,
                x: 0,
                y: 0,
                transition: {
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                }
            }
        },
    };

    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <motion.line
                x1={4}
                y1={6}
                x2={20}
                y2={6}
                variants={animations.line1}
                initial="initial"
                animate={isOpen ? "animate" : "closed"}
            />
            <motion.line
                x1={4}
                y1={12}
                x2={20}
                y2={12}
                variants={animations.line2}
                initial="initial"
                animate={isOpen ? "animate" : "closed"}
            />
            <motion.line
                x1={4}
                y1={18}
                x2={20}
                y2={18}
                variants={animations.line3}
                initial="initial"
                animate={isOpen ? "animate" : "closed"}
            />
        </motion.svg>
    );
}
