---
name: gsap-animations
description: >-
  GreenSock Animation Platform (GSAP 3) animation skill for high-performance, award-winning web UI.
  Covers React/Next.js integration, gsap.context() lifecycle scoping, timelines, ScrollTrigger,
  staggered entrances, luxury typography reveals, micro-interactions, hardware-accelerated transforms,
  and anti-jank best practices for StyleFleet and modern web apps. Use whenever designing, implementing,
  polishing, or debugging GSAP animations, transitions, scroll-driven visual effects, or interactive UI components.
---

# GSAP Animations & Motion Design Guide

This skill guides the implementation of high-performance, studio-quality animations and micro-interactions using **GSAP 3 (GreenSock Animation Platform)** in modern React and Next.js applications (App Router, Client Components).

---

## 1. Core Principles & Philosophy

1. **Performant Composited Properties Only**:
   - Always animate transforms (`x`, `y`, `xPercent`, `yPercent`, `scale`, `scaleX`, `scaleY`, `rotation`, `skewX`) and `opacity`.
   - Never animate layout-triggering properties directly (`width`, `height`, `top`, `left`, `margin`, `padding`) unless animating CSS variables or height with layout containment.
2. **Proper React 18 Lifecycle Scoping**:
   - In React (strict mode, fast refresh, component unmounting), GSAP animations **must** be scoped within `gsap.context()` inside a `useLayoutEffect` / `useEffect`, and reverted in the cleanup function:
     ```tsx
     useEffect(() => {
       const ctx = gsap.context(() => {
         // All gsap animations here are automatically collected & cleaned up!
         gsap.from('.hero-headline', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out' });
       }, containerRef);

       return () => ctx.revert(); // Essential: prevents memory leaks & duplicate duplicate tweens!
     }, []);
     ```
3. **Restraint & Luxury Timing**:
   - Luxury UI feels grounded, deliberate, and silky smooth—not bouncy or cartoony.
   - Default to `power3.out`, `power4.out`, or `expo.out` for entrances.
   - Duration: 0.6s to 1.2s for large hero elements; 0.2s to 0.4s for interactive buttons and pills.
   - Stagger: 0.05s to 0.12s between items for natural cascading reveals.

---

## 2. Essential GSAP Patterns in React & Next.js

### A. Component Scoping with `gsap.context()`
```tsx
'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export function LuxuryFeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Scoped selectors inside cardRef
      gsap.from('.feature-icon', {
        scale: 0.7,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
      gsap.from('.feature-text', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.15,
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={cardRef} className="rounded-3xl p-7 bg-[#0B1E3B] border border-white/10 shadow-xl">
      <div className="feature-icon w-12 h-12 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] mb-4">
        {icon}
      </div>
      <h3 className="feature-text text-xl font-bold text-white mb-2">{title}</h3>
      <p className="feature-text text-sm text-slate-300 leading-relaxed">{description}</p>
    </div>
  );
}
```

---

### B. Master Timeline Orchestration
Group interrelated sequential steps cleanly with `gsap.timeline()`:
```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero-badge', { y: -15, opacity: 0, duration: 0.6 })
      .from('.hero-title', { y: 35, opacity: 0, duration: 0.9 }, '-=0.3')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.hero-cta-buttons', { scale: 0.95, opacity: 0, duration: 0.5 }, '-=0.4')
      .from('.hero-device-preview', { y: 50, opacity: 0, duration: 1.1, ease: 'power4.out' }, '-=0.4');
  }, heroRef);

  return () => ctx.revert();
}, []);
```

---

### C. ScrollTrigger Setup & Dynamic Imports in Next.js
When using `ScrollTrigger`, register the plugin client-side only:
```tsx
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// In useEffect:
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.pricing-card', {
      scrollTrigger: {
        trigger: '.pricing-container',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
    });
  });

  return () => ctx.revert();
}, []);
```

---

### D. Interactive Hover Micro-Interactions
Create reusable hover tweens using quickTo or scoped functions:
```tsx
const onButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  gsap.to(e.currentTarget, {
    scale: 1.03,
    boxShadow: '0 15px 30px -5px rgba(212, 175, 55, 0.35)',
    duration: 0.25,
    ease: 'power2.out',
  });
};

const onButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  gsap.to(e.currentTarget, {
    scale: 1,
    boxShadow: '0 10px 20px -5px rgba(212, 175, 55, 0.15)',
    duration: 0.3,
    ease: 'power2.out',
  });
};
```

---

## 3. StyleFleet Luxury Animation Palette

- **Gold Glow Breathing Effect**:
  ```tsx
  gsap.to('.luxury-glow-halo', {
    opacity: 0.85,
    scale: 1.08,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
  ```

- **Numeric Counters with Running Digits**:
  ```tsx
  const counterObj = { val: 0 };
  gsap.to(counterObj, {
    val: 9999,
    duration: 1.4,
    ease: 'power3.out',
    onUpdate: () => {
      element.innerText = `₹${Math.round(counterObj.val).toLocaleString('en-IN')}`;
    },
  });
  ```

- **Staggered Table & Card List Reveal**:
  ```tsx
  gsap.from('.bill-row', {
    x: -25,
    opacity: 0,
    stagger: 0.06,
    duration: 0.5,
    ease: 'power2.out',
  });
  ```

---

## 4. Anti-Patterns & Best Practices

1. ❌ **Do NOT call `gsap.to()` directly in body without cleanup.** Always wrap in `gsap.context()` inside `useEffect`.
2. ❌ **Do NOT animate `left`, `top`, `margin`.** Use `x`, `y`, `xPercent`, `yPercent`.
3. ❌ **Do NOT trigger layout thrashing.** Avoid reading DOM attributes (`offsetHeight`, `getBoundingClientRect`) repeatedly inside update loops; let GSAP cache measurements.
4. ❌ **Avoid conflicting CSS transitions.** If a class has `transition: all 0.3s ease`, it will fight GSAP's inline style updates. Remove CSS transitions on properties driven by GSAP.
5. ✅ **Always support `prefers-reduced-motion`:**
   ```tsx
   const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   if (prefersReducedMotion) {
     // Skip animation or use instant opacity
   }
   ```
