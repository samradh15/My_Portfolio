document.addEventListener('DOMContentLoaded', () => {
    // Fix "Weird Scroll Jump"
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0); // Force top on reload

    initProjectPreview();
    initClock();
    initScrollSpy();
    initThemeToggle();
    initScrollAnimations();
});

/**
 * .5 Scroll Animations
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target); // Reveal once
            }
        });
    }, {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before bottom
    });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

/**
 * 0. Theme Toggle
 */
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const status = document.getElementById('theme-status');
    const html = document.documentElement;

    // Check saved
    const saved = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', saved);
    status.textContent = saved === 'dark' ? 'Dark' : 'Light';

    btn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        status.textContent = next === 'dark' ? 'Dark' : 'Light';
    });
}

/**
 * 1. Project Preview Interaction
 */
function initProjectPreview() {
    const previewWindow = document.getElementById('project-preview-window');
    const previewTarget = document.getElementById('preview-target');
    const rows = document.querySelectorAll('.log-row');

    rows.forEach(row => {
        row.addEventListener('mouseenter', (e) => {
            const color = row.getAttribute('data-preview');
            previewTarget.style.backgroundColor = color;
            previewWindow.classList.add('active');
        });

        row.addEventListener('mouseleave', () => {
            previewWindow.classList.remove('active');
        });
    });
}

/**
 * 2. Live "Engineering" Clock
 */
function initClock() {
    const clockEl = document.getElementById('live-clock');

    const updateTime = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        if (clockEl) clockEl.textContent = `${timeString} IST`;
    };

    updateTime();
    setInterval(updateTime, 1000);
}

/**
 * 3. Active ScrollSpy
 * Highlights the sidebar nav based on scroll position
 */
function initScrollSpy() {
    const navContainer = document.querySelector('.editorial-nav');
    const navLinks = Array.from(document.querySelectorAll('.editorial-nav .nav-link'));
    const navTargets = navLinks
        .map(link => {
            const href = link.getAttribute('href') || '';
            const id = href.startsWith('#') ? href.slice(1) : '';
            const section = id ? document.getElementById(id) : null;
            return section ? { id, link, section } : null;
        })
        .filter(Boolean);

    if (!navTargets.length) return;

    const wheelEnabled = Boolean(navContainer && navTargets.length > 4);
    if (wheelEnabled) {
        navContainer.classList.add('nav-wheel');
    }

    let activeId = null;
    let wheelHovered = false;
    let wheelTargetIndex = 0;
    let wheelVisualIndex = 0;
    let wheelAnimationFrame = null;
    let suppressMouseLeaveSyncUntil = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const indexForId = (id) => navTargets.findIndex(target => target.id === id);

    const renderWheelState = (centerIndex) => {
        if (!wheelEnabled) return;

        navTargets.forEach((target, index) => {
            const delta = index - centerIndex;
            const distance = Math.abs(delta);
            const translateY = delta * 48;
            const rotateX = delta * -8;
            const scale = Math.max(0.8, 1 - (distance * 0.1));
            const opacity = distance > 3 ? 0 : Math.max(0.14, 1 - (distance * 0.22));

            target.link.style.transform = `translateY(calc(-50% + ${translateY}px)) rotateX(${rotateX}deg) scale(${scale})`;
            target.link.style.opacity = `${opacity}`;
            target.link.style.zIndex = `${100 - Math.round(distance * 10)}`;
            target.link.style.pointerEvents = distance > 2.35 ? 'none' : 'auto';
        });
    };

    const animateWheel = () => {
        const diff = wheelTargetIndex - wheelVisualIndex;
        if (Math.abs(diff) < 0.001) {
            wheelVisualIndex = wheelTargetIndex;
            renderWheelState(wheelVisualIndex);
            wheelAnimationFrame = null;
            return;
        }

        wheelVisualIndex += diff * 0.2;
        renderWheelState(wheelVisualIndex);
        wheelAnimationFrame = requestAnimationFrame(animateWheel);
    };

    const startWheelAnimation = () => {
        if (!wheelEnabled) return;
        if (wheelAnimationFrame !== null) return;
        wheelAnimationFrame = requestAnimationFrame(animateWheel);
    };

    const setActive = (id, options = {}) => {
        if (!id) return;
        const { syncWheel = true, immediateWheel = false } = options;
        const activeIndex = indexForId(id);

        if (wheelEnabled && activeIndex >= 0 && syncWheel) {
            wheelTargetIndex = activeIndex;
            if (immediateWheel) {
                wheelVisualIndex = activeIndex;
                renderWheelState(wheelVisualIndex);
            } else {
                startWheelAnimation();
            }
        }

        if (id === activeId) return;

        activeId = id;

        navTargets.forEach(target => {
            target.link.classList.toggle('active', target.id === id);
        });
    };

    const computeActiveSection = () => {
        const marker = window.scrollY + (window.innerHeight * 0.35);
        let currentId = navTargets[0].id;

        navTargets.forEach(target => {
            if (target.section.offsetTop <= marker) {
                currentId = target.id;
            }
        });

        const nearPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (nearPageBottom) {
            currentId = navTargets[navTargets.length - 1].id;
        }

        setActive(currentId);
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            computeActiveSection();
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', computeActiveSection);

    if (wheelEnabled && navContainer) {
        renderWheelState(wheelVisualIndex);

        navContainer.addEventListener('mouseenter', () => {
            wheelHovered = true;
        });

        navContainer.addEventListener('mouseleave', () => {
            wheelHovered = false;
            if (performance.now() < suppressMouseLeaveSyncUntil) return;
            computeActiveSection();
        });

        navContainer.addEventListener('wheel', (event) => {
            if (!wheelHovered) return;

            event.preventDefault();

            const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
            wheelTargetIndex = clamp(
                wheelTargetIndex + (delta / 220),
                0,
                navTargets.length - 1
            );

            const focusedIndex = clamp(
                Math.round(wheelTargetIndex),
                0,
                navTargets.length - 1
            );

            setActive(navTargets[focusedIndex].id, { syncWheel: false });
            startWheelAnimation();
        }, { passive: false });
    }

    navTargets.forEach(target => {
        target.link.addEventListener('click', () => {
            suppressMouseLeaveSyncUntil = performance.now() + 450;
            setActive(target.id);
        });
    });

    computeActiveSection();
}

/**
 * 4. Modal Logic
 */
window.openModal = function (templateId) {
    const template = document.getElementById(`tmpl-${templateId}`);
    if (!template) return;

    const modalContent = document.getElementById('modal-content');
    const overlay = document.getElementById('modal-overlay');

    modalContent.innerHTML = '';
    modalContent.appendChild(template.content.cloneNode(true));
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

window.closeModal = function () {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeModal();
});

// Close on outside click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') window.closeModal();
});

/**
 * Force Download for PDF
 * Bypasses browser PDF viewer preferences and forces save.
 */
window.forceDownload = function (url, filename) {
    console.log("Forcing download of:", url);
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(console.error);
}
