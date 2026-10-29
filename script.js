// 모바일 메뉴: 열림 상태를 스크린 리더에도 전달합니다.
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 681px)').addEventListener('change', closeMenu);

// 자연스러운 등장 효과: 화면에 들어오는 요소만 한 번 애니메이션 처리합니다.
// IntersectionObserver가 없는 환경과 모션 줄이기 설정에서는 내용을 그대로 표시합니다.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    element.classList.add('is-pending');
    revealObserver.observe(element);
  });
}

// 현재 보고 있는 구역을 메뉴에 표시합니다. 스크롤 이벤트의 반복 계산을 피합니다.
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('main > section').forEach(section => sectionObserver.observe(section));
}
document.querySelector('#year').textContent = new Date().getFullYear();

// 공연 이미지: 5초 간격으로 포스터 → 리플릿1 → 리플릿2 → 포스터 순환.
// 마우스 또는 키보드로 살펴보는 동안, 탭을 떠났을 때에는 자동 전환을 멈춥니다.
const slider = document.querySelector('.concert-slider');
if (slider) {
  const slides = [...slider.querySelectorAll('.concert-slide')];
  const controls = slider.querySelector('.slider-controls');
  let moving = false;
  let current = 0;
  let paused = reducedMotion.matches;
  let hovered = false;
  let timer;
  controls.hidden = false;
  function schedule() {
    clearInterval(timer);

    if (!paused && !hovered && !document.hidden && !slider.contains(document.activeElement)) {
      timer = setInterval(() => show(current + 1), 5000);
    }
  }
  async function show(index) {
    if (moving) return;
    const next = (index + slides.length) % slides.length;
    if (next === current) return;
    const outgoing = slides[current];
    const incoming = slides[next];
    const direction = index > current ? 1 : -1;
    moving = true;
    incoming.hidden = false;
    outgoing.inert = true;
    incoming.inert = true;
    // 두 이미지를 같은 속도로 밀어 이동시켜 마지막 → 첫 이미지도 자연스럽게 순환합니다.
    if (!reducedMotion.matches && incoming.animate) {
      const options = { duration: 650, easing: 'cubic-bezier(.22,.61,.36,1)' };
      const animations = [
        outgoing.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-direction * 100}%)` }], options),
        incoming.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }], options)
      ];
      await Promise.allSettled(animations.map(animation => animation.finished));
    }
    outgoing.hidden = true;
    outgoing.inert = false;
    incoming.inert = false;
    current = next;
    moving = false;
  }
  slider.querySelector('[data-slide="prev"]').addEventListener('click', () => { show(current - 1); schedule(); });
  slider.querySelector('[data-slide="next"]').addEventListener('click', () => { show(current + 1); schedule(); });

  slider.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  slider.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  slider.addEventListener('focusin', schedule);
  slider.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; schedule(); });
  schedule();
}


// 첫 화면: 5초 자동 전환과 도트 선택. 수동 선택은 마우스 정지 상태에서도 동작합니다.
const hero = document.querySelector('.hero');
if (hero) {
  const photos = [...hero.querySelectorAll('.hero-photo')];
  const dotGroup = hero.querySelector('.hero-dots');
  const dots = [...dotGroup.querySelectorAll('button')];
  let index = 0;
  let timer;
  let animations = [];
  let moving = false;
  let manualMove = false;
  let revision = 0;
  let hovered = hero.matches(':hover');
  const stopped = () => hovered || document.hidden || reducedMotion.matches || hero.contains(document.activeElement);
  dotGroup.hidden = false;
  function updateDots() {
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }
  async function showPhoto(next, manual = false) {
    if (!manual && (moving || stopped())) return;
    const request = ++revision;
    animations.forEach(animation => animation.cancel());
    animations = [];
    photos.forEach((photo, i) => { photo.hidden = i !== index; });
    moving = false;
    if (next === index) { syncHero(); return; }
    moving = true;
    manualMove = manual;
    const outgoing = photos[index];
    const incoming = photos[next];
    try { await incoming.decode(); } catch { if (request === revision) moving = false; return; }
    if (request !== revision) return;
    if (!manual && stopped()) { moving = false; return; }
    incoming.hidden = false;
    if (!reducedMotion.matches && incoming.animate) {
      const direction = manual && next < index ? -1 : 1;
      const options = { duration: 850, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' };
      animations = [
        outgoing.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-direction * 100}%)` }], options),
        incoming.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }], options)
      ];
      await Promise.allSettled(animations.map(animation => animation.finished));
      if (request !== revision) return;
    }
    outgoing.hidden = true;
    animations.forEach(animation => animation.cancel());
    animations = [];
    index = next;
    moving = false;
    manualMove = false;
    updateDots();
  }
  function syncHero() {
    clearInterval(timer);
    if (!manualMove) animations.forEach(animation => stopped() ? animation.pause() : animation.play());
    if (!stopped()) timer = setInterval(() => showPhoto((index + 1) % photos.length), 5000);
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => { showPhoto(i, true); syncHero(); }));
  hero.addEventListener('mouseenter', () => { hovered = true; syncHero(); });
  hero.addEventListener('mouseleave', () => { hovered = false; syncHero(); });
  hero.addEventListener('focusin', syncHero);
  hero.addEventListener('focusout', () => setTimeout(syncHero, 0));
  document.addEventListener('visibilitychange', syncHero);
  reducedMotion.addEventListener('change', syncHero);
  syncHero();
}

// 수상 갤러리: 5초마다 다음 사진으로 수평 이동하고 마지막 사진 뒤에는 첫 사진으로 순환합니다.
const gallerySlider = document.querySelector('.gallery-slider');
if (gallerySlider) {
  const pictures = [...gallerySlider.querySelectorAll('.gallery-photo')];
  let current = 0;
  let timer;
  let moving = false;
  let animations = [];
  let hovered = gallerySlider.matches(':hover');
  const stopped = () => hovered || document.hidden || reducedMotion.matches || gallerySlider.contains(document.activeElement);
  async function nextPhoto() {
    if (moving || stopped()) return;
    moving = true;
    const next = (current + 1) % pictures.length;
    const outgoing = pictures[current];
    const incoming = pictures[next];
    try { await incoming.decode(); } catch { moving = false; return; }
    if (stopped()) { moving = false; return; }
    incoming.hidden = false;
    const options = { duration: 800, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' };
    animations = [
      outgoing.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], options),
      incoming.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], options)
    ];
    await Promise.allSettled(animations.map(animation => animation.finished));
    outgoing.hidden = true;
    animations.forEach(animation => animation.cancel());
    animations = [];
    current = next;
    moving = false;
  }
  function syncGallery() {
    clearInterval(timer);
    animations.forEach(animation => stopped() ? animation.pause() : animation.play());
    if (!stopped()) timer = setInterval(nextPhoto, 5000);
  }
  gallerySlider.addEventListener('mouseenter', () => { hovered = true; syncGallery(); });
  gallerySlider.addEventListener('mouseleave', () => { hovered = false; syncGallery(); });
  gallerySlider.addEventListener('focusin', syncGallery);
  gallerySlider.addEventListener('focusout', () => setTimeout(syncGallery, 0));
  document.addEventListener('visibilitychange', syncGallery);
  reducedMotion.addEventListener('change', syncGallery);
  syncGallery();
}
