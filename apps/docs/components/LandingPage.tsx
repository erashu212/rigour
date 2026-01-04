'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, RefreshCw, Layout as LayoutIcon, Code2 } from 'lucide-react'

export function Hero() {
    return (
        <div className="relative overflow-hidden py-24 sm:py-32 border-b border-[var(--brand-border)]">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/[var(--hero-gradient-opacity)] blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/[var(--hero-gradient-opacity)] blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium mb-8 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        Rigour v2.1 Suite is Live
                    </div>

                    <img
                        src="/logo.jpg"
                        alt="Rigour Logo"
                        className="mx-auto w-28 h-28 mb-10 rounded-[2.5rem] shadow-2xl shadow-cyan-500/30 ring-1 ring-[var(--brand-border)]"
                    />

                    <h1 className="text-5xl font-black tracking-tighter text-[var(--brand-text)] sm:text-7xl lg:text-8xl mb-8 leading-[0.9]">
                        The Quality Gate <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-600 to-blue-600 dark:from-white dark:to-slate-400">
                            For AI Engineering
                        </span>
                    </h1>

                    <p className="mt-8 text-xl leading-relaxed text-[var(--brand-muted)] max-w-2xl mx-auto font-medium">
                        Rigour is the automated enforcement engine that keeps AI agents in check.
                        Detect architectural drift, enforce AST-based gates, and auto-heal violations.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/getting-started"
                            className="w-full sm:w-auto rounded-2xl bg-cyan-600 text-white dark:bg-white dark:text-slate-950 px-10 py-4 text-base font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Start Engineering <ArrowRight size={20} />
                        </a>
                        <a
                            href="https://github.com/rigour-labs/rigour"
                            target="_blank"
                            className="w-full sm:w-auto rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-[var(--brand-border)] px-10 py-4 text-base font-bold text-[var(--brand-text)] hover:bg-slate-200 dark:hover:bg-white/10 transition-all backdrop-blur-xl"
                        >
                            Protocol Spec
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export function FeatureGrid() {
    const features = [
        {
            title: 'Contextual Discovery',
            description: 'Zero-config analysis that identifies project roles and paradigms with sub-second latency.',
            icon: <LayoutIcon className="text-cyan-600 dark:text-cyan-400" size={24} />,
        },
        {
            title: 'AST Analysis Gates',
            description: 'Go beyond linting with deep structural checks for complexity, SOLID, and type safety.',
            icon: <Code2 className="text-blue-600 dark:text-blue-400" size={24} />,
        },
        {
            title: 'Fix Packet Engine',
            description: 'Deterministic feedback loops that provide agents with high-fidelity instructions for auto-healing.',
            icon: <RefreshCw className="text-indigo-600 dark:text-indigo-400" size={24} />,
        }
    ]

    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative p-10 rounded-[2rem] bg-slate-100/50 dark:bg-slate-900/40 border border-[var(--brand-border)] hover:border-cyan-500/50 transition-all group overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="p-4 rounded-2xl bg-[var(--brand-bg)] w-fit mb-8 group-hover:scale-110 transition-transform border border-[var(--brand-border)] shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-[var(--brand-text)] mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-[var(--brand-muted)] leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
