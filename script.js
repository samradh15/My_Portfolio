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
    const sections = ['work', 'philosophy', 'resume', 'contact'];
    const navLinks = {
        'work': document.getElementById('nav-work'),
        'philosophy': document.getElementById('nav-philosophy'),
        'resume': document.getElementById('nav-resume'),
        'contact': document.getElementById('nav-contact')
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all
                Object.values(navLinks).forEach(link => {
                    if (link) link.classList.remove('active');
                });
                // Add to current
                if (navLinks[entry.target.id]) {
                    navLinks[entry.target.id].classList.add('active');
                }
            }
        });
    }, { threshold: 0.3 }); // Trigger when 30% visible

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
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
