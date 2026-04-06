import React from 'react';

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${2 + Math.random() * 3}px`,
    height: `${2 + Math.random() * 3}px`,
    opacity: 0.12 + Math.random() * 0.22,
    animationDuration: `${6 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 8}s`,
}));

export default function AnimatedBackground() {
    return (
        <>
            <div className="lp-bg-particles" aria-hidden="true">
                {PARTICLES.map((p, i) => <div key={i} className="lp-particle" style={p} />)}
            </div>
            <div className="lp-blob lp-blob-1" aria-hidden="true" />
            <div className="lp-blob lp-blob-2" aria-hidden="true" />
            <div className="lp-blob lp-blob-3" aria-hidden="true" />
        </>
    );
}
