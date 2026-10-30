/*
처음 읽는 분을 위한 JavaScript 안내
document는 현재 HTML 문서입니다. querySelector는 첫 요소, querySelectorAll은 여러 요소를 찾습니다.
const는 다시 대입하지 않는 변수, let은 값이 바뀌는 변수입니다.
function은 재사용할 동작 묶음이며, () => { ... }도 함수를 만드는 문법입니다.
if는 조건문, return은 함수 종료, ===는 값 비교, !는 반대, &&는 모두 참, ||는 하나라도 참입니다.
읽는 순서: 메뉴 → 스크롤 효과 → 공통 슬라이더 → 슬라이더별 설정.
*/

// 1. 모바일 메뉴: CSS의 is-open과 화면 읽기 프로그램용 aria-expanded를 함께 바꿉니다.
const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const menuLinks = navigation.querySelectorAll("a");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
}

function closeMenu() {
  setMenu(false);
}

// addEventListener는 클릭이나 키 입력 같은 사건에 실행할 함수를 연결합니다.
toggle.addEventListener("click", () => {
  setMenu(toggle.getAttribute("aria-expanded") !== "true");
});
menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  // closest는 클릭한 요소부터 부모 방향으로 찾습니다. 헤더 바깥을 누르면 메뉴를 닫습니다.
  if (!event.target.closest(".header")) closeMenu();
});
window.matchMedia("(min-width: 681px)").addEventListener("change", closeMenu);

// 2. 스크롤 효과: 운영체제의 움직임 줄이기 설정을 .matches로 확인합니다.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if ("IntersectionObserver" in window) {
  // IntersectionObserver는 요소가 화면의 관찰 영역에 들어오고 나가는 것을 알려줍니다.
  if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        revealObserver.unobserve(entry.target); // 한 번 등장하면 관찰을 끝냅니다.
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("is-pending");
      revealObserver.observe(element);
    });
  }

  // 화면 위 20%, 아래 60%를 제외한 띠를 기준으로 현재 구역의 메뉴에 밑줄을 표시합니다.
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      menuLinks.forEach((link) => {
        // hash는 #about 같은 주소 부분입니다. ${...}는 값을 문자열에 끼워 넣습니다.
        if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-20% 0px -60% 0px", threshold: 0 });
  document.querySelectorAll("main > section").forEach((section) => sectionObserver.observe(section));
}

// textContent는 요소 안의 글자입니다. 방문자 기기의 현재 연도로 갱신합니다.
document.querySelector("#year").textContent = new Date().getFullYear();

// 3. 공통 슬라이더: 사진 선택, 가로 이동, 5초 자동 전환을 세 구역에서 재사용합니다.
// options는 서로 다른 부분(사진 선택자, 버튼, 전환 시간)을 이름: 값으로 묶은 객체입니다.
function createSlider(selector, options) {
  const slider = document.querySelector(selector);
  if (!slider) return;

  // [...목록]은 목록을 배열로 바꿉니다. 배열의 첫 항목 번호는 0입니다.
  const slides = [...slider.querySelectorAll(options.slides)];
  if (slides.length < 2) return;
  const dots = options.dots ? [...slider.querySelectorAll(options.dots)] : [];
  const controls = slider.querySelector(options.controls);
  let current = 0;
  let timer;
  let animations = [];
  let moving = false;
  let manualMove = false;
  let requestId = 0;

  function stopped() {
    // 사진을 읽거나 조작하는 동안, 다른 탭을 보거나 움직임 줄이기를 사용할 때 자동 재생을 멈춥니다.
    return slider.matches(":hover") || slider.contains(document.activeElement) ||
      document.hidden || reducedMotion.matches;
  }

  function updateDots() {
    dots.forEach((dot, index) => {
      if (index === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  async function show(index, manual = false) {
    if (!manual && (moving || stopped())) return;
    // %는 나머지입니다. 마지막 다음은 첫 사진, 첫 사진 이전은 마지막 사진으로 순환합니다.
    const next = (index + slides.length) % slides.length;
    const request = ++requestId;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.inert = false;
    });
    moving = false;
    manualMove = manual;
    if (next === current) return;
    moving = true;

    const outgoing = slides[current];
    const incoming = slides[next];
    const photo = incoming.matches("img") ? incoming : incoming.querySelector("img");
    try {
      // 숨겨진 lazy 사진도 미리 읽습니다. await는 이미지 준비가 끝날 때까지 이 함수만 기다립니다.
      photo.loading = "eager";
      await photo.decode();
    } catch {
      if (request === requestId) moving = false;
      return; // 이미지 로딩에 실패하면 현재 사진을 유지합니다.
    }
    // 연속 클릭 시 이전 요청의 늦은 완료가 최신 선택을 덮어쓰지 않게 합니다.
    if (request !== requestId) return;
    if (!manual && stopped()) {
      moving = false;
      return;
    }

    incoming.hidden = false;
    outgoing.inert = incoming.inert = true; // 이동 중인 링크는 클릭/키보드 탐색에서 잠시 제외합니다.
    if (!reducedMotion.matches && incoming.animate) {
      const direction = index > current ? 1 : -1;
      const animationOptions = { duration: options.duration, easing: options.easing || "ease", fill: "forwards" };
      // translateX(100%)는 사진 너비만큼 오른쪽 이동입니다. 나갈 사진과 들어올 사진을 함께 움직입니다.
      animations = [
        outgoing.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-direction * 100}%)` }], animationOptions),
        incoming.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: "translateX(0)" }], animationOptions),
      ];
      // 완료 또는 취소될 때까지 두 애니메이션을 기다립니다.
      await Promise.allSettled(animations.map((animation) => animation.finished));
      if (request !== requestId) return;
    }
    outgoing.hidden = true;
    outgoing.inert = incoming.inert = false;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    current = next;
    moving = false;
    manualMove = false;
    updateDots();
  }

  function syncPlayback() {
    clearInterval(timer); // 기존 타이머를 지워 중복 재생을 막습니다.
    animations.forEach((animation) => {
      if (reducedMotion.matches) animation.finish();
      else if (!manualMove && stopped()) animation.pause();
      else animation.play();
    });
    // setInterval은 반복 실행입니다. 5000밀리초는 5초입니다.
    if (!stopped()) timer = setInterval(() => show(current + 1), 5000);
  }

  function select(index) {
    show(index, true); // 수동 선택은 자동 재생 정지 상태에서도 가능합니다.
    syncPlayback();
  }
  dots.forEach((dot, index) => dot.addEventListener("click", () => select(index)));
  slider.querySelectorAll("[data-slide]").forEach((button) => {
    button.addEventListener("click", () => select(current + (button.dataset.slide === "next" ? 1 : -1)));
  });
  slider.addEventListener("mouseenter", syncPlayback);
  slider.addEventListener("mouseleave", syncPlayback);
  slider.addEventListener("focusin", syncPlayback);
  // 초점이 다음 요소로 이동한 뒤 상태를 확인하도록 실행을 잠시 미룹니다.
  slider.addEventListener("focusout", () => setTimeout(syncPlayback, 0));
  document.addEventListener("visibilitychange", syncPlayback);
  reducedMotion.addEventListener("change", syncPlayback);

  if (controls) controls.hidden = false;
  updateDots();
  syncPlayback();
}

// 4. 구역마다 다른 설정만 적습니다. 사진이나 버튼을 찾는 이름은 HTML의 class와 같습니다.
createSlider(".hero", {
  slides: ".hero-photo", dots: ".hero-dots button", controls: ".hero-dots",
  duration: 850, easing: "cubic-bezier(.22,.61,.36,1)",
});
createSlider(".concert-slider", {
  slides: ".concert-slide", controls: ".slider-controls",
  duration: 650, easing: "cubic-bezier(.22,.61,.36,1)",
});
createSlider(".gallery-slider", {
  slides: ".gallery-photo", dots: ".gallery-dot", controls: ".gallery-dots", duration: 800,
});
