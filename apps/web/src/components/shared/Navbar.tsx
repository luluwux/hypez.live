"use client";

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { MenuIcon } from '@/components/ui/menu-icon';
import { NavSearch } from '@/components/shared/NavSearch';
import { AnimatePresence, motion } from 'framer-motion';
import { ShineBorder } from '@/components/lului/BorderShine';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButtonClient } from '@/components/auth/user-button-client';
import { useTranslation } from '@/lib/i18n/hooks';

type CardNavLink = {
    label: string;
    href: string;
    ariaLabel: string;
};

export type CardNavItem = {
    label: string;
    bgColor: string;
    textColor: string;
    links: CardNavLink[];
};

export interface CardNavProps {
    logo?: string; // Optional image URL
    logoAlt?: string;
    items: CardNavItem[];
    className?: string;
    ease?: string;
    baseColor?: string;
    menuColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
}

const CardNav: React.FC<CardNavProps> = ({
    logo,
    logoAlt = 'Hypez',
    items,
    className = '',
    ease = 'power3.out',
    baseColor = '#0f0f11', // Default dark
    menuColor = '#ffffff',
    buttonBgColor,
    buttonTextColor
}) => {
    const { t } = useTranslation();
    const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const navRef = useRef<HTMLDivElement | null>(null);
    const cardsRef = useRef<HTMLDivElement[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const pathname = usePathname();

    React.useEffect(() => {
        if (isExpanded || isHamburgerOpen) {
            setIsHamburgerOpen(false);
            if (tlRef.current) {
                tlRef.current.eventCallback('onReverseComplete', () => setIsExpanded(false));
                tlRef.current.reverse();
            } else {
                setIsExpanded(false);
            }
        }
    }, [pathname]);

    React.useEffect(() => {
        const handleScroll = () => {
            // Show search when scrolled past 400px
            setShowSearch(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const calculateHeight = () => {
        const navEl = navRef.current;
        if (!navEl) return 260;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
            if (contentEl) {
                const wasVisible = contentEl.style.visibility;
                const wasPointerEvents = contentEl.style.pointerEvents;
                const wasPosition = contentEl.style.position;
                const wasHeight = contentEl.style.height;

                contentEl.style.visibility = 'visible';
                contentEl.style.pointerEvents = 'auto';
                contentEl.style.position = 'static';
                contentEl.style.height = 'auto';

                contentEl.offsetHeight; // Force reflow

                const topBar = 60;
                const padding = 16;
                const contentHeight = contentEl.scrollHeight;

                contentEl.style.visibility = wasVisible;
                contentEl.style.pointerEvents = wasPointerEvents;
                contentEl.style.position = wasPosition;
                contentEl.style.height = wasHeight;

                return topBar + contentHeight + padding;
            }
        }
        return 260;
    };

    const createTimeline = () => {
        const navEl = navRef.current;
        if (!navEl) return null;

        gsap.set(navEl, { height: 60, overflow: 'hidden' });
        gsap.set(cardsRef.current, { y: 50, opacity: 0 });

        const tl = gsap.timeline({ paused: true });

        tl.to(navEl, {
            height: calculateHeight,
            duration: 0.25,
            ease
        });

        tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.2, ease, stagger: 0.03 }, '-=0.08');

        return tl;
    };

    useLayoutEffect(() => {
        const tl = createTimeline();
        tlRef.current = tl;

        // Cleanup on unmount or deps change
        return () => {
            tl?.kill();
            tlRef.current = null;
        };
    }, [ease, items]);

    useLayoutEffect(() => {
        const handleResize = () => {
            if (!tlRef.current) return;

            if (isExpanded) {
                const newHeight = calculateHeight();
                gsap.set(navRef.current, { height: newHeight });

                // Recreate timeline for new height if needed (though GSAP usually handles simple property updates, 
                // recalculating height logic might be complex so rebuilding is safer for responsive state switches)
                tlRef.current.kill();
                const newTl = createTimeline();
                if (newTl) {
                    newTl.progress(1); // Set to end state
                    tlRef.current = newTl;
                }
            } else {
                tlRef.current.kill();
                const newTl = createTimeline();
                if (newTl) {
                    tlRef.current = newTl;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded]);

    const toggleMenu = () => {
        const tl = tlRef.current;
        if (!tl) return;
        if (!isExpanded) {
            setIsHamburgerOpen(true);
            setIsExpanded(true);
            tl.play(0);
        } else {
            setIsHamburgerOpen(false);
            tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
            tl.reverse();
        }
    };

    const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
        if (el) cardsRef.current[i] = el;
    };

    return (
        <div
            className={`card-nav-container fixed left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[999] top-6 ${className}`}
        >
            <nav
                ref={navRef}
                className={`card-nav ${isExpanded ? 'open' : ''} block h-[60px] p-0 rounded-2xl shadow-2xl relative overflow-hidden will-change-[height] border border-white/5 backdrop-blur-md`}
                style={{ backgroundColor: baseColor }}
            >
                <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 px-4 z-[2]">
                    <div
                        className="hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer order-1 md:order-none"
                        onClick={toggleMenu}
                        role="button"
                        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
                        tabIndex={0}
                        style={{ color: menuColor }}
                    >
                        <MenuIcon isOpen={isHamburgerOpen} />
                    </div>

                    <div className="logo-container flex items-center justify-center order-2 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:order-none w-auto z-[50]">
                        <AnimatePresence mode="wait">
                            {showSearch ? (
                                <motion.div
                                    key="nav-search"
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-[200px] sm:w-[240px] md:w-[450px]"
                                >
                                    <NavSearch />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="nav-logo"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Link href="/" className="font-bold text-xl text-white tracking-tight">
                                        Hypez<span className="text-brand-500">.</span>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 h-full order-3 md:order-none">
                        <UserButtonClient />
                    </div>

                </div>

                <div
                    className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
                        } md:flex-row md:items-end md:gap-[12px]`}
                    aria-hidden={!isExpanded}
                >
                    {(items || []).slice(0, 3).map((item, idx) => (
                        <div
                            key={`${item.label}-${idx}`}
                            className="nav-card select-none relative flex flex-col gap-2 p-5 rounded-xl min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%] overflow-hidden border border-white/5"
                            ref={setCardRef(idx)}
                            style={{ backgroundColor: item.bgColor, color: item.textColor }}
                        >
                            {/* ShineBorder Added */}
                            <ShineBorder
                                className="absolute inset-0 rounded-xl pointer-events-none z-0"
                                borderWidth={1}
                                shineColor={["#3b82f6", "#0ea5e9", "#06b6d4"]}
                            />

                            {/* Card Content (z-10 to stay above shine) */}
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="nav-card-label font-bold tracking-tight text-[18px] md:text-[20px] mb-2 opacity-80">
                                    {item.label}
                                </div>
                                <div className="nav-card-links mt-auto flex flex-col gap-2">
                                    {item.links?.map((lnk, i) => (
                                        <Link
                                            key={`${lnk.label}-${i}`}
                                            className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer transition-opacity duration-300 hover:opacity-100 opacity-60 text-[14px] md:text-[15px] font-medium"
                                            href={lnk.href}
                                            aria-label={lnk.ariaLabel}
                                        >
                                            <ArrowUpRight className="nav-card-link-icon w-4 h-4 shrink-0" aria-hidden="true" />
                                            {lnk.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export function Navbar() {
    const { t } = useTranslation();

    const items = [
        {
            label: t("navbar.discover"),
            bgColor: "transparent",
            textColor: "#fff",
            links: [
                { label: t("navbar.allServers"), href: "/servers", ariaLabel: "Go to Discover Page" },
                { label: t("navbar.allUsers"), href: "/users", ariaLabel: "Browse All Users" },
                { label: t("navbar.leaderboard"), href: "/top", ariaLabel: "Browse Top Servers" }
            ]
        },
        {
            label: t("navbar.services"),
            bgColor: "transparent",
            textColor: "#fff",
            links: [
                { label: t("navbar.getPremium"), href: "/premium", ariaLabel: "View Premium Plans" },
                { label: t("navbar.addBot"), href: "https://discord.com/oauth2/authorize?client_id=1167849489755811960&permissions=5630429932145857&integration_type=0&scope=bot+applications.commands", ariaLabel: "Add Bot" }
            ]
        },
        {
            label: t("navbar.support"),
            bgColor: "transparent",
            textColor: "#fff",
            links: [
                { label: t("navbar.discordServer"), href: "https://discord.gg/hypez", ariaLabel: "Join Discord" },
                { label: t("navbar.helpCenter"), href: "/help", ariaLabel: "Help Center" },
                { label: t("navbar.terms"), href: "/legal/terms", ariaLabel: "Terms of Use" }
            ]
        }
    ];

    return (
        <CardNav
            items={items}
            baseColor="rgba(20, 20, 22, 0.4)" // Semi-transparent for blur effect
            // Actually let's keep base solid for animation performance, or add backdrop class
            menuColor="#fff"
            buttonBgColor="#0ea5e9" // brand-500 (sky-500)
            buttonTextColor="#fff"
            ease="power3.out"
            className="font-sans" // Ensure font matches app
        />
    );
}
