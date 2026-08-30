// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navList = document.getElementById('navList');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navList.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Contact form: lightweight client-side validation + honeypot spam check.
// The form still POSTs normally to the PHP endpoint (no fetch/AJAX),
// keeping things as simple as possible and letting the existing
// backend handle the actual mail delivery.
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

if (form) {
  form.addEventListener('submit', (event) => {
    // Honeypot: if this hidden field got filled in, it's a bot — silently
    // block submission instead of sending it to the mail script.
    const honeypot = form.querySelector('#website');
    if (honeypot && honeypot.value.trim() !== '') {
      event.preventDefault();
      return;
    }

    const requiredFields = form.querySelectorAll('[required]');
    let firstInvalid = null;

    requiredFields.forEach((field) => {
      const value = field.value.trim();
      const isEmail = field.type === 'email';
      const emailOk = !isEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      if (!value || !emailOk) {
        field.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = field;
      } else {
        field.removeAttribute('aria-invalid');
      }
    });

    if (firstInvalid) {
      event.preventDefault();
      status.dataset.state = 'error';
      status.textContent = 'Bitte prüfen Sie die markierten Pflichtfelder.';
      firstInvalid.focus();
      return;
    }

    status.dataset.state = 'ok';
    status.textContent = 'Danke, Ihre Anfrage wird gesendet …';
    // Form submits normally from here (no preventDefault) — the browser
    // navigates to whatever the PHP endpoint returns.
  });
}

// Sticky header: gains a background/shadow once the page scrolls past the top.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  let headerTicking = false;
  const updateHeader = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 20);
    headerTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!headerTicking) {
      requestAnimationFrame(updateHeader);
      headerTicking = true;
    }
  }, { passive: true });
  updateHeader();
}

// Scroll reveal: cards/list items marked [data-reveal] fade+slide in once,
// staggered slightly within their parent group. Falls back to showing
// everything immediately if IntersectionObserver isn't available.
const revealEls = document.querySelectorAll('[data-reveal]');
if (revealEls.length) {
  const groups = new Map();
  revealEls.forEach((el) => {
    const group = groups.get(el.parentElement) || [];
    group.push(el);
    groups.set(el.parentElement, group);
  });
  groups.forEach((group) => {
    group.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
}

// Animated stat counters: numeric hero stats count up from 0 once the
// stat strip scrolls into view. Non-numeric stats (DE, 24/7) are untouched.
const statStrip = document.querySelector('.stat-strip');
if (statStrip) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = statStrip.querySelectorAll('[data-count-to]');

  const animateCount = (el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.countSuffix || '';
    if (prefersReducedMotion || Number.isNaN(target)) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const statObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            counters.forEach(animateCount);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      statObserver.observe(statStrip);
    } else {
      counters.forEach(animateCount);
    }
  }
}
