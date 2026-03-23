import { useEffect, useRef, useState } from 'react';

// Animated floating particle
function Particle({ style }) {
    return <div className="lp-particle" style={style} />;
}

// Stat counter with animated count-up
function StatCard({ value, label, icon, delay }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    let start = 0;
                    const end = parseInt(value, 10);
                    const duration = 1400;
                    const step = Math.ceil(end / (duration / 16));
                    const timer = setInterval(() => {
                        start += step;
                        if (start >= end) { setCount(end); clearInterval(timer); }
                        else setCount(start);
                    }, 16);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);

    return (
        <div className="lp-stat" ref={ref} style={{ animationDelay: delay }}>
            <div className="lp-stat-icon">{icon}</div>
            <div className="lp-stat-value">{count}{value.includes('+') ? '+' : ''}</div>
            <div className="lp-stat-label">{label}</div>
        </div>
    );
}

// Feature row
function Feature({ icon, title, desc, accent, delay }) {
    return (
        <div className="lp-feature" style={{ animationDelay: delay }}>
            <div className="lp-feature-icon" style={{ background: accent + '18', border: `1px solid ${accent}40` }}>
                {icon}
            </div>
            <div>
                <div className="lp-feature-title">{title}</div>
                <div className="lp-feature-desc">{desc}</div>
            </div>
        </div>
    );
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${2 + Math.random() * 3}px`,
    height: `${2 + Math.random() * 3}px`,
    opacity: 0.12 + Math.random() * 0.22,
    animationDuration: `${6 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 8}s`,
}));

const DYNAMIC_WORDS = ['Every', 'All', 'Your', 'Any'];

export default function Landing({ onNavigate }) {
    const [scrolled, setScrolled] = useState(false);
    const [wordIdx, setWordIdx] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setWordIdx(i => (i + 1) % DYNAMIC_WORDS.length), 2500);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onScroll = () => setScrolled(el.scrollTop > 60);
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="view active lp-root" id="v-landing" ref={containerRef}>
            {/* Animated background particles */}
            <div className="lp-bg-particles" aria-hidden="true">
                {PARTICLES.map((p, i) => <Particle key={i} style={p} />)}
            </div>

            {/* Glowing blobs */}
            <div className="lp-blob lp-blob-1" aria-hidden="true" />
            <div className="lp-blob lp-blob-2" aria-hidden="true" />
            <div className="lp-blob lp-blob-3" aria-hidden="true" />

            {/* Top bar */}
            <header className={`lp-header ${scrolled ? 'lp-header-scrolled' : ''}`}>
                <div className="lp-logo">
                    EDU<span className="y">TRACK</span>
                </div>
                <div className="lp-header-right">
                </div>
            </header>

            {/* Hero section */}
            <section className="lp-hero">
                <div className="lp-hero-eyebrow">
                    <span className="lp-pulse-dot" />
                    Learning Management System
                </div>

                <h1 className="lp-hero-title">
                    <span className="lp-title-line">Manage</span>
                    <span className="lp-title-line lp-title-accent">
                        <span className="lp-title-outline" key={wordIdx} style={{ animation: 'lp-slide-up 0.5s ease both' }}>{DYNAMIC_WORDS[wordIdx]}</span> Class
                    </span>
                    <span className="lp-title-line">Effortlessly.</span>
                </h1>

                <p className="lp-hero-sub">
                    A unified platform for teachers to manage groups and admins to oversee all educational operations — all in one place.
                </p>

                {/* CTA cards */}
                <div className="lp-cta-row">
                    <button className="lp-cta-card lp-cta-teacher" onClick={() => onNavigate('teacher-login')}>
                        <div className="lp-cta-bg" />
                        <div className="lp-cta-glow" />
                        <div className="lp-cta-inner">
                            <div className="lp-cta-icon">
                                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><path d="M19 8l2 2-2 2" /><path d="M17 12h4" /></svg>
                            </div>
                            <div className="lp-cta-text">
                                <div className="lp-cta-title">Teacher Portal</div>
                                <div className="lp-cta-desc">Manage groups, track progress, log student data</div>
                            </div>
                            <div className="lp-cta-arrow">
                                <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        <div className="lp-cta-badge">Teacher</div>
                    </button>

                    <button className="lp-cta-card lp-cta-admin" onClick={() => onNavigate('admin-login')}>
                        <div className="lp-cta-bg" />
                        <div className="lp-cta-glow lp-cta-glow-admin" />
                        <div className="lp-cta-inner">
                            <div className="lp-cta-icon lp-cta-icon-admin">
                                <svg viewBox="0 0 24 24"><path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z" /><polyline points="9 12 11 14 15 10" /></svg>
                            </div>
                            <div className="lp-cta-text">
                                <div className="lp-cta-title">Admin Panel</div>
                                <div className="lp-cta-desc">Full oversight of teachers, groups & platform metrics</div>
                            </div>
                            <div className="lp-cta-arrow lp-cta-arrow-admin">
                                <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        <div className="lp-cta-badge lp-cta-badge-admin">Admin</div>
                    </button>
                </div>
            </section>

            {/* Stats section */}
            <section className="lp-stats-section">
                <div className="lp-stats-divider" />
                <div className="lp-stats-grid">
                    <StatCard value="100+" label="Active Students" delay="0s"
                        icon={<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                    />
                    <StatCard value="20+" label="Teachers" delay="0.1s"
                        icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
                    />
                    <StatCard value="30+" label="Active Groups" delay="0.2s"
                        icon={<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
                    />
                    <StatCard value="5+" label="Specializations" delay="0.3s"
                        icon={<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                    />
                </div>
                <div className="lp-stats-divider" />
            </section>

            {/* Features section */}
            <section className="lp-features-section">
                <div className="lp-section-label">Platform Features</div>
                <h2 className="lp-section-title">Everything you need, <span className="y">nothing you don't</span></h2>
                <div className="lp-features-grid">
                    <Feature delay="0s" accent="#f5c518"
                        icon={<svg viewBox="0 0 24 24"><path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z" /><polyline points="9 12 11 14 15 10" /></svg>}
                        title="Admin Full Oversight"
                        desc="Seamlessly manage all teachers, overview platform stats, and securely delete accounts or groups."
                    />
                    <Feature delay="0.05s" accent="#4ade80"
                        icon={<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                        title="Progress Analytics"
                        desc="Visualize student progress with detailed level bars and segmented completion stats."
                    />
                    <Feature delay="0.1s" accent="#60a5fa"
                        icon={<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                        title="24-Hour Schedule"
                        desc="Set class times with precise 24-hour formatting and view upcoming sessions instantly."
                    />
                    <Feature delay="0.15s" accent="#f472b6"
                        icon={<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>}
                        title="Role-Based Dashboards"
                        desc="Distinct, secure portals for administrators and teachers with dedicated permissions."
                    />
                    <Feature delay="0.2s" accent="#a78bfa"
                        icon={<svg viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>}
                        title="Course-Aware Filters"
                        desc="Intelligent class filtering ensuring teachers only see subjects relevant to their expertise."
                    />
                    <Feature delay="0.25s" accent="#fb923c"
                        icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>}
                        title="Multi-Specialization"
                        desc="Assign teachers up to two distinct subject specializations for flexible course management."
                    />
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="lp-bottom-cta">
                <div className="lp-bcta-glow" />
                <p className="lp-bcta-label">Ready to get started?</p>
                <h2 className="lp-bcta-title">Choose your portal <span className="y">below</span></h2>
                <div className="lp-bcta-row">
                    <button className="lp-bcta-btn lp-bcta-teacher" onClick={() => onNavigate('teacher-login')}>
                        Teacher Sign In
                    </button>
                    <button className="lp-bcta-btn lp-bcta-admin" onClick={() => onNavigate('admin-login')}>
                        Admin Sign In
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <span className="lp-footer-logo">EDU<span className="y">TRACK</span></span>
                <span className="lp-footer-copy">© 2026 — Learning Management System</span>
            </footer>
        </div>
    );
}
