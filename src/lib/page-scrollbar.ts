class PageScrollbar extends HTMLElement {
    private thumb!: HTMLElement;
    private events?: AbortController;
    private resizeObserver?: ResizeObserver;
    private lockObserver?: MutationObserver;
    private frame = 0;
    private scrollRange = 0;
    private thumbHeight = 0;
    private thumbTravel = 0;
    private drag?: { pointerId: number; offset: number };

    connectedCallback() {
        this.thumb = this.querySelector<HTMLElement>('.thumb')!;
        this.events = new AbortController();
        const { signal } = this.events;

        window.addEventListener('scroll', this.scheduleUpdate, { passive: true, signal });
        window.addEventListener('resize', this.scheduleUpdate, { signal });
        window.addEventListener('blur', this.endDrag, { signal });
        this.addEventListener('pointerdown', this.onPointerDown, { signal });
        this.addEventListener('pointermove', this.onPointerMove, { signal });
        this.addEventListener('pointerup', this.onPointerEnd, { signal });
        this.addEventListener('pointercancel', this.onPointerEnd, { signal });
        this.addEventListener('lostpointercapture', this.onPointerEnd, { signal });
        this.addEventListener('keydown', this.onKeyDown, { signal });

        // Images, fonts, and expanded content can change the document height.
        this.resizeObserver = new ResizeObserver(this.scheduleUpdate);
        this.resizeObserver.observe(document.documentElement);
        this.resizeObserver.observe(document.body);
        this.lockObserver = new MutationObserver(this.scheduleUpdate);
        this.lockObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-search-modal-open', 'data-mobile-menu-expanded', 'style'],
        });
        this.update();
    }

    disconnectedCallback() {
        this.endDrag();
        this.events?.abort();
        this.resizeObserver?.disconnect();
        this.lockObserver?.disconnect();
        cancelAnimationFrame(this.frame);
        this.frame = 0;
    }

    private scheduleUpdate = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = 0;
            this.update();
        });
    };

    private update() {
        const root = document.documentElement;
        this.scrollRange = Math.max(0, root.scrollHeight - root.clientHeight);
        const overflow = getComputedStyle(document.body).overflowY;
        this.hidden = this.scrollRange === 0 || overflow === 'hidden' || overflow === 'clip';
        if (this.hidden) {
            this.endDrag();
            return;
        }

        const trackHeight = this.clientHeight;
        this.thumbHeight = Math.min(trackHeight, Math.max(32, trackHeight * root.clientHeight / root.scrollHeight));
        this.thumbTravel = trackHeight - this.thumbHeight;
        const progress = Math.max(0, Math.min(1, window.scrollY / this.scrollRange));
        this.thumb.style.height = `${this.thumbHeight}px`;
        this.thumb.style.transform = `translateY(${progress * this.thumbTravel}px)`;
        this.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }

    private scrollToThumb(offset: number) {
        if (this.thumbTravel <= 0) return;
        const progress = Math.max(0, Math.min(1, offset / this.thumbTravel));
        window.scrollTo({ top: progress * this.scrollRange, behavior: 'instant' });
        this.scheduleUpdate();
    }

    private onPointerDown = (event: PointerEvent) => {
        if (this.drag || !event.isPrimary || event.button !== 0) return;
        this.update();
        if (this.hidden) return;

        event.preventDefault();
        this.focus({ preventScroll: true });
        const thumbBounds = this.thumb.getBoundingClientRect();
        const onThumb = event.clientY >= thumbBounds.top && event.clientY <= thumbBounds.bottom;
        this.drag = {
            pointerId: event.pointerId,
            offset: onThumb ? event.clientY - thumbBounds.top : this.thumbHeight / 2,
        };
        this.setPointerCapture(event.pointerId);
        this.setAttribute('data-dragging', '');
        this.scrollToThumb(event.clientY - this.getBoundingClientRect().top - this.drag.offset);
    };

    private onPointerMove = (event: PointerEvent) => {
        if (this.drag?.pointerId !== event.pointerId) return;
        this.scrollToThumb(event.clientY - this.getBoundingClientRect().top - this.drag.offset);
    };

    private onPointerEnd = (event: PointerEvent) => {
        if (this.drag?.pointerId === event.pointerId) this.endDrag();
    };

    private endDrag = () => {
        const pointerId = this.drag?.pointerId;
        this.drag = undefined;
        this.removeAttribute('data-dragging');
        if (pointerId !== undefined && this.hasPointerCapture(pointerId)) {
            this.releasePointerCapture(pointerId);
        }
    };

    private onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        this.update();
        if (this.hidden) return;
        const pageStep = document.documentElement.clientHeight * 0.9;
        let top = window.scrollY;
        switch (event.key) {
            case 'ArrowUp': top -= 40; break;
            case 'ArrowDown': top += 40; break;
            case 'PageUp': top -= pageStep; break;
            case 'PageDown': top += pageStep; break;
            case 'Home': top = 0; break;
            case 'End': top = this.scrollRange; break;
            case ' ': top += event.shiftKey ? -pageStep : pageStep; break;
            default: return;
        }
        event.preventDefault();
        window.scrollTo({ top: Math.max(0, Math.min(this.scrollRange, top)), behavior: 'instant' });
        this.scheduleUpdate();
    };
}

customElements.define('page-scrollbar', PageScrollbar);
