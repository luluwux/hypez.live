"use client";

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    className?: string; // Add className prop
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
}
const arrowLeftAnimations = {
    default: {
        group: {
            initial: {
                x: 0,
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
            animate: {
                x: '-25%',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
        },
        path1: {},
        path2: {},
    }, // Removed satisfies for looser typing to avoid conflicts
    'default-loop': {
        group: {
            initial: {
                x: 0,
            },
            animate: {
                x: [0, '-25%', 0],
                transition: { ease: 'easeInOut', duration: 0.6 },
            },
        },
        path1: {},
        path2: {},
    },
    pointing: {
        group: {},
        path1: {
            initial: {
                d: 'M19 12H5',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
            animate: {
                d: 'M19 12H10',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
        },
        path2: {
            initial: {
                d: 'm12 19-7-7 7-7',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
            animate: {
                d: 'm15.5 19-7-7 7-7',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
        },
    },
    'pointing-loop': {
        group: {},
        path1: {
            initial: {
                d: 'M19 12H5',
            },
            animate: {
                d: ['M19 12H5', 'M19 12H10', 'M19 12H5'],
                transition: { ease: 'easeInOut', duration: 0.6 },
            },
        },
        path2: {
            initial: {
                d: 'm12 19-7-7 7-7',
            },
            animate: {
                d: ['m12 19-7-7 7-7', 'm15.5 19-7-7 7-7', 'm12 19-7-7 7-7'],
                transition: { ease: 'easeInOut', duration: 0.6 },
            },
        },
    },
    out: {
        group: {
            initial: {
                x: 0,
            },
            animate: {
                x: [0, '-150%', '150%', 0],
                transition: {
                    default: { ease: 'easeInOut', duration: 0.6 },
                    x: {
                        ease: 'easeInOut',
                        duration: 0.6,
                        times: [0, 0.5, 0.5, 1],
                    },
                },
            },
        },
        path1: {},
        path2: {},
    },
};

export function ArrowLeft({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    className,
    onMouseEnter,
    onMouseLeave,
    onClick
}: IconProps) {
    // Simplified hooking: assume parent handles hover triggering animation state if needed, 
    // BUT the user code used `useAnimateIconContext`. 
    // Since I don't have that context/lib, I will implement a simple self-contained hover state.
    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onMouseEnter?.();
    };
    const handleMouseLeave = () => {
        setIsHovered(false);
        onMouseLeave?.();
    };

    // Defaulting to "default" animation on hover
    const variants = arrowLeftAnimations.default;

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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <motion.g
                variants={variants.group as Variants}
                initial="initial"
                animate={isHovered ? "animate" : "initial"}
            >
                <motion.path
                    d="M19 12H5"
                    variants={variants.path1 as Variants}
                />
                <motion.path
                    d="m12 19-7-7 7-7"
                    variants={variants.path2 as Variants}
                />
            </motion.g>
        </motion.svg>
    );
}
const arrowRightAnimations = {
    default: {
        group: {
            initial: {
                x: 0,
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
            animate: {
                x: '25%',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
        },
        path1: {},
        path2: {},
    },
    'default-loop': {
        group: {
            initial: {
                x: 0,
            },
            animate: {
                x: [0, '25%', 0],
                transition: { ease: 'easeInOut', duration: 0.6 },
            },
        },
        path1: {},
        path2: {},
    },
    pointing: {
        group: {},
        path1: {
            initial: {
                d: 'M5 12h14',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
            animate: {
                d: 'M5 12h10',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
        },
        path2: {
            initial: {
                d: 'm12 5 7 7-7 7',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
            animate: {
                d: 'm8 5 7 7-7 7',
                transition: { ease: 'easeInOut', duration: 0.3 },
            },
        },
    },
    'pointing-loop': {
        group: {},
        path1: {
            initial: {
                d: 'M5 12h14',
            },
            animate: {
                d: ['M5 12h14', 'M5 12h10', 'M5 12h14'],
                transition: { ease: 'easeInOut', duration: 0.6 },
            },
        },
        path2: {
            initial: {
                d: 'm12 5 7 7-7 7',
            },
            animate: {
                d: ['m12 5 7 7-7 7', 'm8 5 7 7-7 7', 'm12 5 7 7-7 7'],
                transition: { ease: 'easeInOut', duration: 0.6 },
            },
        },
    },
    out: {
        group: {
            initial: {
                x: 0,
            },
            animate: {
                x: [0, '150%', '-150%', 0],
                transition: {
                    default: { ease: 'easeInOut', duration: 0.6 },
                    x: {
                        ease: 'easeInOut',
                        duration: 0.6,
                        times: [0, 0.5, 0.5, 1],
                    },
                },
            },
        },
        path1: {},
        path2: {},
    },
};

export function ArrowRight({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    className,
    onMouseEnter,
    onMouseLeave,
    onClick
}: IconProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onMouseEnter?.();
    };
    const handleMouseLeave = () => {
        setIsHovered(false);
        onMouseLeave?.();
    };

    const variants = arrowRightAnimations.default;

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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <motion.g
                variants={variants.group as Variants}
                initial="initial"
                animate={isHovered ? "animate" : "initial"}
            >
                <motion.path
                    d="M5 12h14"
                    variants={variants.path1 as Variants}
                />
                <motion.path
                    d="m12 5 7 7-7 7"
                    variants={variants.path2 as Variants}
                />
            </motion.g>
        </motion.svg>
    );
}
