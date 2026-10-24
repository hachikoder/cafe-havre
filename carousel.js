(() => {
    const root = document.querySelector('.space-carousel');
    if (!root) return;

    const viewport = root.querySelector('.carousel');
    const list = viewport.querySelector('ol');
    const originals = [...list.children];
    if (originals.length < 2) return;

    const previous = root.querySelector('.carousel-prev');
    const next = root.querySelector('.carousel-next');
    const counter = root.querySelector('.carousel-counter');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const WAIT = 4000;
    const DURATION = 600;
    const count = originals.length;

    // 前後に1セットずつコピーし、端でも隣の写真が見えるようにする。
    function cloneSlides() {
        return originals.map(slide => {
            const copy = slide.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            copy.querySelector('img').alt = '';
            return copy;
        });
    }
    list.prepend(...cloneSlides());
    list.append(...cloneSlides());
    const slides = [...list.children];
    let active = count;
    let autoplay = !reducedMotion.matches;
    let timer;
    let settleTimer;
    let frame;
    let animating = false;
    let touching = false;
    let hovered = false;

    // 変形後の見た目ではなく、レイアウト上の中心位置を使う。
    function center(index) {
        const first = slides[0];
        return slides[index].offsetLeft - first.offsetLeft
            + slides[index].offsetWidth / 2 - viewport.clientWidth / 2;
    }

    function highlight() {
        let distance = Infinity;
        slides.forEach((slide, index) => {
            const delta = Math.abs(center(index) - viewport.scrollLeft);
            if (delta < distance) {
                distance = delta;
                active = index;
            }
        });
        slides.forEach((slide, index) => slide.classList.toggle('is-active', index === active));
        counter.textContent = `${active % count + 1} / ${count}`;
    }

    function schedule() {
        clearTimeout(timer);
        if (!autoplay || hovered || touching || animating || document.hidden
            || root.querySelector(':focus-visible')) return;
        timer = setTimeout(() => move(1), WAIT);
    }

    // コピーの位置から同じ写真の本来の位置へ、アニメーションなしで戻す。
    function normalize() {
        const span = center(count * 2) - center(count);
        const logical = ((active % count) + count) % count;
        const shift = active < count ? span : active >= count * 2 ? -span : 0;
        if (shift) {
            viewport.style.scrollSnapType = 'none';
            viewport.scrollLeft += shift;
            active = count + logical;
            viewport.style.scrollSnapType = '';
        }
        highlight();
    }

    function settle() {
        if (animating || touching) return;
        normalize();
        schedule();
    }

    function cancelAnimation() {
        cancelAnimationFrame(frame);
        animating = false;
        viewport.style.scrollSnapType = '';
        clearTimeout(timer);
    }

    function move(direction) {
        if (animating || touching) return;
        clearTimeout(timer);
        clearTimeout(settleTimer);
        normalize();
        const start = viewport.scrollLeft;
        const destination = center(active + direction);
        const started = performance.now();
        const duration = reducedMotion.matches ? 0 : DURATION;
        animating = true;
        viewport.style.scrollSnapType = 'none';

        function animate(now) {
            const progress = duration ? Math.min((now - started) / duration, 1) : 1;
            const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
            viewport.scrollLeft = start + (destination - start) * eased;
            highlight();
            if (progress < 1) {
                frame = requestAnimationFrame(animate);
            } else {
                animating = false;
                normalize();
                viewport.style.scrollSnapType = '';
                schedule();
            }
        }
        frame = requestAnimationFrame(animate);
    }

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    viewport.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
    });

    viewport.addEventListener('scroll', () => {
        highlight();
        clearTimeout(timer);
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 180);
    }, { passive:true });
    viewport.addEventListener('wheel', cancelAnimation, { passive:true });
    viewport.addEventListener('pointerdown', () => {
        touching = true;
        cancelAnimation();
    });
    function release() {
        if (!touching) return;
        touching = false;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 180);
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    root.addEventListener('mouseenter', () => { hovered = true; clearTimeout(timer); });
    root.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    root.addEventListener('focusin', () => clearTimeout(timer));
    root.addEventListener('focusout', () => setTimeout(schedule, 0));
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimation(); clearTimeout(settleTimer); }
        else settle();
    });

    reducedMotion.addEventListener('change', () => {
        autoplay = !reducedMotion.matches;
        cancelAnimation();
        settle();
    });

    // 画面幅が変わっても、選択中の写真を中央に維持する。
    new ResizeObserver(() => {
        cancelAnimation();
        active = count + active % count;
        viewport.style.scrollSnapType = 'none';
        viewport.scrollLeft = center(active);
        viewport.style.scrollSnapType = '';
        highlight();
        schedule();
    }).observe(viewport);

    viewport.scrollLeft = center(active);
    highlight();
    schedule();
})();
