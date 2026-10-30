/*
처음 읽는 분을 위한 JavaScript 안내
JS는 HTML 요소를 찾아 클릭, 스크롤, 사진 전환 같은 동작을 연결합니다.
document는 현재 HTML 문서, querySelector는 조건에 맞는 첫 요소, querySelectorAll은 모든 요소를 찾습니다.
const는 다시 대입하지 않을 변수, let은 값이 바뀌는 변수입니다. const로 찾은 HTML 요소의 속성은 바꿀 수 있습니다.
function은 재사용할 동작 묶음입니다. () => { ... }도 함수이며 이벤트가 발생할 때 실행할 동작으로 자주 사용합니다.
if는 조건문, return은 함수 종료, ===는 같은지 비교, !==는 다른지 비교합니다.
!는 반대, &&는 모두 참, ||는 하나라도 참이라는 뜻입니다. true/false는 참/거짓 값입니다.
읽는 순서: 메뉴 → 스크롤 등장 → 현재 메뉴/연도 → 공연 슬라이더 → 첫 화면 슬라이더 → 수상 갤러리.
각 if 블록이나 함수 안의 변수는 그 범위에서만 사용하므로 서로 다른 slider, timer 이름이 나옵니다.
*/
// 모바일 메뉴: 열림 상태를 스크린 리더에도 전달합니다.
// CSS와 같은 .클래스 / #아이디 표기로 HTML 요소를 찾아 변수에 보관합니다. 이 메뉴 코드는 HTML에 해당 요소가 있다는 전제입니다.
const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
// 닫기 동작을 함수 하나로 만들면 링크 클릭, Escape, 바깥 클릭에서 재사용할 수 있습니다.
function closeMenu() {
  // setAttribute는 HTML 속성을 바꿉니다. 접근성 상태를 닫힘으로 알리고 다음 줄에서 CSS용 is-open도 제거합니다.
  toggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}
// addEventListener는 사건(이벤트)에 함수를 연결합니다. 여기서는 버튼이 클릭될 때 중괄호 안의 코드를 실행합니다.
toggle.addEventListener("click", () => {
  // 기존 값이 "true"가 아니면 open은 true입니다. String(open)은 참/거짓을 HTML 속성에 넣을 문자열로 바꿉니다.
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  // classList.toggle(이름, 조건)은 조건이 참이면 클래스를 추가하고 거짓이면 제거합니다. CSS의 .header nav.is-open과 연결됩니다.
  navigation.classList.toggle("is-open", open);
});
// 모든 메뉴 링크를 찾고 forEach로 하나씩 돌면서 닫기 함수를 연결합니다. closeMenu 뒤에 ()가 없으므로 지금 실행하지 않고 함수를 전달합니다.
navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
// event에는 눌린 키 같은 사건 정보가 들어옵니다. Escape로 닫은 뒤 focus()로 메뉴 버튼에 키보드 초점을 돌려줍니다.
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    toggle.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  // target은 클릭된 요소입니다. closest는 자신부터 부모 방향으로 찾으므로 header 바깥을 눌렀을 때만 닫습니다.
  if (!event.target.closest(".header")) closeMenu();
});
// matchMedia는 CSS와 같은 화면 조건을 확인합니다. 681px 경계를 넘어 조건 결과가 바뀌면 메뉴를 닫습니다.
window.matchMedia("(min-width: 681px)").addEventListener("change", closeMenu);

// 자연스러운 등장 효과: 화면에 들어오는 요소만 한 번 애니메이션 처리합니다.
// IntersectionObserver가 없는 환경과 모션 줄이기 설정에서는 내용을 그대로 표시합니다.
// 사용자의 움직임 줄이기 설정을 확인합니다. .matches는 현재 조건이 맞는지를 참/거짓으로 알려줍니다.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  // IntersectionObserver는 요소가 관찰 영역에 들어오고 나가는 것을 알려주는 브라우저 기능입니다.
  const revealObserver = new IntersectionObserver(
    (entries) => {
      // entries는 이번에 상태가 바뀐 관찰 결과들의 목록입니다. 각각의 target은 관찰 대상, isIntersecting은 영역에 걸쳐 있는지입니다.
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-pending");
          // 한 번 등장한 요소는 관찰을 끝내서 스크롤할 때마다 다시 숨겨지지 않게 합니다.
          revealObserver.unobserve(entry.target);
        }
      });
    },
    // threshold: 0.08은 요소 면적의 8%가 보이는 비율을 관찰 기준으로 삼습니다. 실제 등장 조건은 위의 isIntersecting입니다.
    { threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-pending");
    revealObserver.observe(element);
  });
}

// 현재 보고 있는 구역을 메뉴에 표시합니다. 스크롤 이벤트의 반복 계산을 피합니다.
if ("IntersectionObserver" in window) {
  // 등장 효과와 별개로 본문 구역을 관찰합니다. 해당 구역의 메뉴에 aria-current를 붙이면 CSS가 밑줄을 보여줍니다.
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navigation.querySelectorAll("a").forEach((link) => {
          // link.hash는 주소의 #about 같은 부분입니다. 백틱 안의 ${...}는 값을 문자열에 끼워 넣는 문법입니다.
          if (link.hash === `#${entry.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    },
    // 화면 위 20%, 아래 60%를 줄인 가운데 띠를 관찰 기준으로 삼아 어느 구역을 읽는지 판단합니다.
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
  );
  document
    .querySelectorAll("main > section")
    .forEach((section) => sectionObserver.observe(section));
}
// Date는 날짜 객체입니다. getFullYear()로 기기의 현재 연도를 얻고 textContent로 HTML 안의 글자를 바꿉니다.
document.querySelector("#year").textContent = new Date().getFullYear();

// 공연 이미지: 5초 간격으로 포스터 → 리플릿1 → 리플릿2 → 포스터 순환.
// 마우스 또는 키보드로 살펴보는 동안, 탭을 떠났을 때에는 자동 전환을 멈춥니다.
const slider = document.querySelector(".concert-slider");
// 요소를 찾지 못하면 null입니다. if(slider)로 공연 영역이 있을 때만 이 블록을 실행합니다.
if (slider) {
  // [...목록]은 펼침 문법으로 목록을 배열로 바꿉니다. 배열 번호는 0부터 시작하므로 slides[0]은 첫 이미지입니다.
  const slides = [...slider.querySelectorAll(".concert-slide")];
  const controls = slider.querySelector(".slider-controls");
  // moving은 전환 중인지, current는 현재 번호, paused/hovered는 자동 재생 중지 조건, timer는 반복 타이머 식별 번호입니다.
  let moving = false;
  let current = 0;
  let paused = reducedMotion.matches;
  let hovered = false;
  let timer;
  controls.hidden = false;
  // 기존 타이머를 지운 뒤 재생 가능한 상태에서만 다시 만듭니다. 중복 타이머가 생겨 사진이 빨리 넘어가는 일을 막습니다.
  function schedule() {
    clearInterval(timer);

    if (
      !paused &&
      !hovered &&
      !document.hidden &&
      // activeElement는 현재 키보드 초점을 가진 요소입니다. 슬라이더 안의 링크나 버튼을 조작하는 동안 자동 전환하지 않습니다.
      !slider.contains(document.activeElement)
    ) {
      // setInterval은 일정 간격으로 반복합니다. 5000밀리초는 5초이며 current + 1로 다음 이미지를 요청합니다.
      timer = setInterval(() => show(current + 1), 5000);
    }
  }
  // async 함수 안의 await는 비동기 작업이 끝날 때까지 이 함수의 다음 진행을 기다립니다. 페이지 전체를 멈추지는 않습니다.
  async function show(index) {
    if (moving) return;
    // %는 나머지 연산입니다. 사진 3장에서 다음 번호 3은 0으로, 이전 번호 -1은 길이를 더한 뒤 2로 바뀌어 순환합니다.
    const next = (index + slides.length) % slides.length;
    if (next === current) return;
    // outgoing은 나갈 사진, incoming은 들어올 사진입니다. 조건 ? 값1 : 값2는 조건에 따라 둘 중 하나를 선택합니다.
    const outgoing = slides[current];
    const incoming = slides[next];
    const direction = index > current ? 1 : -1;
    moving = true;
    incoming.hidden = false;
    // 전환 중인 링크가 잠깐 클릭되거나 키보드 초점을 받지 않도록 inert를 켭니다. 전환이 끝나면 해제합니다.
    outgoing.inert = true;
    incoming.inert = true;
    // 두 이미지를 같은 속도로 밀어 이동시켜 마지막 → 첫 이미지도 자연스럽게 순환합니다.
    if (!reducedMotion.matches && incoming.animate) {
      // 객체는 이름: 값 형태로 설정을 묶습니다. duration은 650밀리초, easing은 움직임의 가속/감속 곡선입니다.
      const options = { duration: 650, easing: "cubic-bezier(.22,.61,.36,1)" };
      // animate에 시작/끝 모습과 옵션을 전달합니다. translateX(100%)는 해당 요소 너비만큼 오른쪽, -100%는 왼쪽으로 이동합니다.
      const animations = [
        outgoing.animate(
          [
            { transform: "translateX(0)" },
            { transform: `translateX(${-direction * 100}%)` },
          ],
          options,
        ),
        incoming.animate(
          [
            { transform: `translateX(${direction * 100}%)` },
            { transform: "translateX(0)" },
          ],
          options,
        ),
      ];
      // 두 애니메이션의 finished(완료 약속)를 map으로 모읍니다. allSettled는 완료 또는 취소로 모두 정리될 때까지 기다립니다.
      await Promise.allSettled(
        animations.map((animation) => animation.finished),
      );
    }
    outgoing.hidden = true;
    outgoing.inert = false;
    incoming.inert = false;
    current = next;
    moving = false;
  }
  // HTML의 data-slide 속성으로 이전 버튼을 선택합니다. 클릭하면 이전 사진을 요청하고 자동 재생 조건도 다시 확인합니다.
  slider.querySelector('[data-slide="prev"]').addEventListener("click", () => {
    show(current - 1);
    schedule();
  });
  slider.querySelector('[data-slide="next"]').addEventListener("click", () => {
    show(current + 1);
    schedule();
  });

  // mouseenter/leave는 마우스 진입/이탈, focusin/out은 키보드 초점 진입/이탈입니다. 각 사건에 맞춰 타이머를 갱신합니다.
  slider.addEventListener("mouseenter", () => {
    hovered = true;
    schedule();
  });
  slider.addEventListener("mouseleave", () => {
    hovered = false;
    schedule();
  });
  slider.addEventListener("focusin", schedule);
  // setTimeout(..., 0)은 초점 이동 처리가 끝난 뒤 상태를 확인하도록 실행을 뒤로 미룹니다.
  slider.addEventListener("focusout", () => setTimeout(schedule, 0));
  // 탭을 떠나거나 돌아왔을 때 document.hidden 상태에 맞춰 자동 재생을 조절합니다.
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    schedule();
  });
  schedule();
}

// 첫 화면: 5초 자동 전환과 도트 선택. 수동 선택은 마우스 정지 상태에서도 동작합니다.
// 첫 화면 슬라이더는 공연 슬라이더와 별도입니다. 도트 클릭과 빠른 연속 선택을 처리하는 기능이 추가되어 있습니다.
const hero = document.querySelector(".hero");
if (hero) {
  const photos = [...hero.querySelectorAll(".hero-photo")];
  const dotGroup = hero.querySelector(".hero-dots");
  const dots = [...dotGroup.querySelectorAll("button")];
  let index = 0;
  let timer;
  let animations = [];
  let moving = false;
  // manualMove는 직접 선택한 이동인지, revision은 가장 최근 요청 번호인지 기록합니다. 이전 요청이 뒤늦게 끝나 새 선택을 덮지 않게 합니다.
  let manualMove = false;
  let revision = 0;
  let hovered = hero.matches(":hover");
  // 여러 중지 조건을 함수로 묶습니다. stopped()를 호출할 때마다 최신 마우스/탭/설정/초점 상태를 검사합니다.
  const stopped = () =>
    hovered ||
    document.hidden ||
    reducedMotion.matches ||
    hero.contains(document.activeElement);
  dotGroup.hidden = false;
  // 도트 목록을 돌며 현재 번호에만 aria-current를 붙입니다. 첫 화면 CSS는 이 속성으로 원의 색상과 크기를 바꿉니다.
  function updateDots() {
    // 각 버튼에 자신의 번호 i를 기억하는 클릭 함수를 연결합니다. 클릭 시 그 번호 사진을 보여줍니다.
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }
  // manual = false는 인수를 생략했을 때의 기본값입니다. 도트를 클릭하면 true를 전달하여 자동 재생 정지 중에도 직접 선택할 수 있습니다.
  async function showPhoto(next, manual = false) {
    if (!manual && (moving || stopped())) return;
    // ++는 1 증가입니다. 이번 요청 번호를 보관하고, await 뒤에 최신 번호와 비교해 오래된 요청을 중단합니다.
    const request = ++revision;
    // 이전에 진행하던 효과를 취소하고 현재 선택 사진만 남긴 뒤 새 전환을 준비합니다.
    animations.forEach((animation) => animation.cancel());
    animations = [];
    photos.forEach((photo, i) => {
      photo.hidden = i !== index;
    });
    moving = false;
    if (next === index) {
      syncHero();
      return;
    }
    moving = true;
    manualMove = manual;
    const outgoing = photos[index];
    const incoming = photos[next];
    try {
      // 이미지 데이터를 화면에 그릴 준비가 될 때까지 기다립니다. 준비 실패는 아래 catch에서 처리합니다.
      await incoming.decode();
    // try에서 오류가 나면 catch로 이동합니다. 사진을 표시할 준비가 안 되었으면 현재 요청을 끝냅니다.
    } catch {
      if (request === revision) moving = false;
      return;
    }
    if (request !== revision) return;
    if (!manual && stopped()) {
      moving = false;
      return;
    }
    incoming.hidden = false;
    if (!reducedMotion.matches && incoming.animate) {
      const direction = manual && next < index ? -1 : 1;
      const options = {
        duration: 850,
        easing: "cubic-bezier(.22,.61,.36,1)",
        // 애니메이션 완료 뒤에도 마지막 위치를 유지합니다. 사진을 숨긴 후 cancel()하여 효과를 정리합니다.
        fill: "forwards",
      };
      animations = [
        outgoing.animate(
          [
            { transform: "translateX(0)" },
            { transform: `translateX(${-direction * 100}%)` },
          ],
          options,
        ),
        incoming.animate(
          [
            { transform: `translateX(${direction * 100}%)` },
            { transform: "translateX(0)" },
          ],
          options,
        ),
      ];
      await Promise.allSettled(
        animations.map((animation) => animation.finished),
      );
      if (request !== revision) return;
    }
    outgoing.hidden = true;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    index = next;
    moving = false;
    manualMove = false;
    updateDots();
  }
  // 첫 화면의 타이머와 애니메이션 상태를 함께 맞춥니다. 직접 선택한 이동이 아닐 때만 정지 조건에 따라 pause/play를 적용합니다.
  function syncHero() {
    clearInterval(timer);
    if (!manualMove)
      animations.forEach((animation) =>
        stopped() ? animation.pause() : animation.play(),
      );
    if (!stopped())
      timer = setInterval(() => showPhoto((index + 1) % photos.length), 5000);
  }
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      showPhoto(i, true);
      syncHero();
    }),
  );
  hero.addEventListener("mouseenter", () => {
    hovered = true;
    syncHero();
  });
  hero.addEventListener("mouseleave", () => {
    hovered = false;
    syncHero();
  });
  hero.addEventListener("focusin", syncHero);
  hero.addEventListener("focusout", () => setTimeout(syncHero, 0));
  document.addEventListener("visibilitychange", syncHero);
  reducedMotion.addEventListener("change", syncHero);
  syncHero();
}

// 수상 갤러리: 5초마다 다음 사진으로 수평 이동하고 마지막 사진 뒤에는 첫 사진으로 순환합니다.

// HTML 문서 해석과 defer 스크립트 실행이 끝난 뒤 발생하는 이벤트입니다. 아래는 수상 갤러리만의 초기화 코드입니다.
document.addEventListener("DOMContentLoaded", function () {
  const slider = document.querySelector(".gallery-slider");
  if (!slider) return;

  const photos = [...slider.querySelectorAll(".gallery-photo")];
  const dots = [...slider.querySelectorAll(".gallery-dot")];

  // 사진이 0~1장이면 넘길 필요가 없어 종료합니다. length는 배열에 들어 있는 항목 개수입니다.
  if (photos.length < 2) return;

  let current = 0;
  let moving = false;
  let timer;

  // 사진 초기 설정
  // 모든 사진을 표시 가능한 상태로 두되 첫 장만 0%, 나머지는 오른쪽 100%에 둡니다. CSS의 overflow: hidden이 창 밖 사진을 가립니다.
  photos.forEach((photo, index) => {
    photo.hidden = false;
    photo.style.transition = "none";
    photo.style.transform = `translateX(${index === 0 ? 0 : 100}%)`;
  });

  // 원형 인디케이터 업데이트
  function updateDots() {
    dots.forEach((dot, index) => {
      const active = index === current;

      dot.classList.toggle("active", active);

      if (active) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  // 사진 이동 함수
  // 갤러리 전환은 CSS transition을 JS로 설정하는 방식입니다. 앞의 두 슬라이더가 사용하는 animate()와 구현 방식이 다릅니다.
  function goToPhoto(index) {
    if (moving || index === current) return;

    moving = true;

    const outgoing = photos[current];
    const incoming = photos[index];

    const direction = index > current ? 1 : -1;

    incoming.style.transition = "none";
    incoming.style.transform = `translateX(${direction * 100}%)`;

    // offsetWidth를 읽어 브라우저가 시작 위치를 계산하게 합니다. void는 읽은 값을 버리며, 다음 위치 변경에 전환 효과가 생기도록 합니다.
    void incoming.offsetWidth;

    outgoing.style.transition = "transform 0.8s ease";
    incoming.style.transition = "transform 0.8s ease";

    outgoing.style.transform = `translateX(${-direction * 100}%)`;

    incoming.style.transform = "translateX(0)";

    // 인디케이터 즉시 변경
    current = index;
    updateDots();

    // 0.8초 전환 시간에 맞춰 800밀리초 뒤 moving을 풀어 다음 이동을 허용합니다. setTimeout은 한 번, setInterval은 반복 실행입니다.
    setTimeout(() => {
      moving = false;
    }, 800);
  }

  // 5초 자동 전환
  // 갤러리 전용 5초 반복입니다. 현재 구현에는 마우스/초점/탭 비활성/움직임 줄이기에 따른 정지 조건이 없습니다.
  function startAutoSlide() {
    clearInterval(timer);

    timer = setInterval(() => {
      const next = (current + 1) % photos.length;
      goToPhoto(next);
    }, 5000);
  }

  // 원형 버튼 클릭 시 해당 사진 이동
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      // 누른 도트의 사진을 요청하고 다음 자동 전환까지의 5초를 다시 셉니다. 전환 중에는 goToPhoto가 요청을 무시합니다.
      goToPhoto(index);
      startAutoSlide();
    });
  });

  updateDots();
  startAutoSlide();
});
