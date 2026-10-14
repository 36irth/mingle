const flowScreens = [
  {
    image: "./assets/flow-create.png",
    alt: "회의 생성 화면",
  },
  {
    image: "./assets/flow-collect.png",
    alt: "참석자 및 참석 조건 설정 화면",
  },
  {
    image: "./assets/flow-track.png",
    alt: "응답 현황 확인 화면",
  },
  {
    image: "./assets/flow-recommend.png",
    alt: "추천 시간 확인 화면",
  },
  {
    image: "./assets/flow-confirm.png",
    alt: "확정 완료 화면",
  },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersReducedMotion) document.body.classList.add("revealReady");
const menuButton = document.querySelector("[data-menu-button]");
const navLinks = document.querySelector("[data-nav-links]");
const progress = document.querySelector("[data-scroll-progress]");
const flowStage = document.querySelector(".flowStage");
const flowSteps = [...document.querySelectorAll("[data-flow-index]")];
const flowStepsTrack = document.querySelector("[data-flow-steps-track]");
const flowImage = document.querySelector("[data-flow-image]");
const flowViewport = document.querySelector(".flowScreenViewport");
const thumbs = [...document.querySelectorAll("[data-thumb-index]")];
const heroSection = document.querySelector(".heroSection");
const smallHeroPhone = document.querySelector("[data-scroll-phone]");
let activeFlowIndex = -1;
let lenis = null;
let flowScrollTicking = false;
let heroScrollTicking = false;
let textFloatTicking = false;
let flowStageProgress = 0;
let flowScreenProgress = 0;

if (!prefersReducedMotion && window.Lenis) {
  lenis = new Lenis({
    duration: 0.92,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.78,
    touchMultiplier: 1.15,
    prevent: (node) => Boolean(node.closest?.(".heroPhone .phoneGlass")),
  });

  lenis.on("scroll", ({ scroll, limit }) => {
    const ratio = limit > 0 ? scroll / limit : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

function setActiveFlow(index) {
  if (index === activeFlowIndex) return;
  activeFlowIndex = index;
  const screen = flowScreens[index];

  flowSteps.forEach((step) => {
    step.classList.toggle("isActive", Number(step.dataset.flowIndex) === index);
  });
  if (flowStepsTrack?.parentElement) {
    flowStepsTrack.parentElement.dataset.activeIndex = String(index);
  }
  thumbs.forEach((thumb) => {
    thumb.classList.toggle("active", Number(thumb.dataset.thumbIndex) === index);
  });
  syncFlowListScroll(index);

  flowViewport?.classList.add("isChanging");
  if (flowViewport) flowViewport.dataset.screen = String(index);

  window.setTimeout(() => {
    if (flowViewport) flowViewport.scrollTop = 0;
    if (flowImage) {
      flowImage.hidden = false;
      flowImage.src = screen.image;
      flowImage.alt = screen.alt;
    }
    flowViewport?.classList.remove("isChanging");
  }, prefersReducedMotion ? 0 : 160);
}

function setMenuOpen(isOpen) {
  navLinks?.classList.toggle("open", isOpen);
  document.body.classList.toggle("menuOpen", isOpen);
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  menuButton?.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  if (isOpen) lenis?.stop();
  else lenis?.start();
}

menuButton?.addEventListener("click", () => {
  setMenuOpen(!navLinks?.classList.contains("open"));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setMenuOpen(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navLinks?.classList.contains("open")) {
    setMenuOpen(false);
    menuButton?.focus();
  }
});
document.addEventListener("click", (event) => {
  if (navLinks?.classList.contains("open") && !event.target.closest(".navShell")) setMenuOpen(false);
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 760 && navLinks?.classList.contains("open")) setMenuOpen(false);
  requestFlowUpdate();
  requestHeroPhoneUpdate();
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    const offset = -94;
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.05 });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  });
});

thumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => {
    const index = Number(thumb.dataset.thumbIndex);
    setActiveFlow(index);
    if (!flowStage) return;
    const stageTop = flowStage.getBoundingClientRect().top + window.scrollY;
    const scrollableDistance = Math.max(1, flowStage.offsetHeight - window.innerHeight);
    const target = stageTop + scrollableDistance * (index / flowScreens.length);
    if (lenis) {
      lenis.scrollTo(target, { duration: 0.9 });
    } else {
      window.scrollTo({ top: target, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        entry.target.querySelectorAll(".splitText .splitChar").forEach((char) => {
          char.style.animation = "none";
          char.offsetHeight;
          char.style.animation = "";
        });
      } else {
        entry.target.classList.remove("visible");
      }
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
);

document.querySelectorAll(".revealItem").forEach((item) => revealObserver.observe(item));

function prepareSplitText(element) {
  if (!element || element.dataset.splitReady === "true") return;
  const nodes = [...element.childNodes];
  const fragment = document.createDocumentFragment();
  let charIndex = 0;

  const appendSplitText = (text, target) => {
    const lines = text.split("\n");
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) target.appendChild(document.createElement("br"));
      const words = line.split(/(\s+)/);

      words.forEach((word) => {
        if (!word) return;
        if (/^\s+$/.test(word)) {
          const space = document.createElement("span");
          space.className = "splitSpace";
          space.setAttribute("aria-hidden", "true");
          target.appendChild(space);
          return;
        }

        const wordSpan = document.createElement("span");
        wordSpan.className = "splitWord";
        [...word].forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.className = "splitChar";
          charSpan.style.setProperty("--char-index", charIndex);
          charSpan.setAttribute("aria-hidden", "true");
          charSpan.textContent = char;
          wordSpan.appendChild(charSpan);
          charIndex += 1;
        });
        target.appendChild(wordSpan);
      });
    });
  };

  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
      fragment.appendChild(node.cloneNode());
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const wrapper = node.cloneNode(false);
      appendSplitText(node.textContent || "", wrapper);
      fragment.appendChild(wrapper);
      return;
    }

    appendSplitText(node.textContent || "", fragment);
  });

  const label = element.textContent.trim();
  element.setAttribute("aria-label", label);
  element.textContent = "";
  element.appendChild(fragment);
  element.classList.add("splitText", "scrollFloat");
  element.dataset.splitReady = "true";
}

document
  .querySelectorAll("#flowTitle")
  .forEach(prepareSplitText);

function updateScrollFloatText() {
  textFloatTicking = false;
  if (prefersReducedMotion) return;

  document.querySelectorAll(".scrollFloat").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const distance = (center - viewportCenter) / Math.max(1, window.innerHeight);
    const shift = Math.max(-18, Math.min(18, distance * -34));
    element.style.setProperty("--float-y", `${shift.toFixed(2)}px`);
  });
}

function requestTextFloatUpdate() {
  if (textFloatTicking) return;
  textFloatTicking = true;
  requestAnimationFrame(updateScrollFloatText);
}

window.addEventListener("scroll", requestTextFloatUpdate, { passive: true });
lenis?.on("scroll", requestTextFloatUpdate);

function updateFlowByScroll() {
  flowScrollTicking = false;
  if (!flowSteps.length || !flowStage) return;

  const rect = flowStage.getBoundingClientRect();
  const scrollableDistance = Math.max(1, flowStage.offsetHeight - window.innerHeight);
  flowStageProgress = Math.min(1, Math.max(0, (window.innerHeight * 0.18 - rect.top) / scrollableDistance));

  const rawStep = flowStageProgress * flowScreens.length;
  const nextIndex = Math.min(flowScreens.length - 1, Math.max(0, Math.floor(rawStep)));
  flowScreenProgress = Math.min(1, Math.max(0, rawStep - nextIndex));

  setActiveFlow(nextIndex);
  syncFlowListScroll(nextIndex);
  syncFlowScreenScroll();
}

function requestFlowUpdate() {
  if (flowScrollTicking) return;
  flowScrollTicking = true;
  requestAnimationFrame(updateFlowByScroll);
}

window.addEventListener("scroll", requestFlowUpdate, { passive: true });
lenis?.on("scroll", requestFlowUpdate);

function syncHeroPhoneScroll() {
  heroScrollTicking = false;
  if (!heroSection || !smallHeroPhone || prefersReducedMotion) return;

  const rect = heroSection.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
  const baseTransform = getComputedStyle(smallHeroPhone).getPropertyValue("--base-transform").trim();
  const shift = (progress - 0.5) * 42;
  smallHeroPhone.style.transform = `${baseTransform} translateY(${shift.toFixed(2)}px)`;
}

function requestHeroPhoneUpdate() {
  if (heroScrollTicking) return;
  heroScrollTicking = true;
  requestAnimationFrame(syncHeroPhoneScroll);
}

window.addEventListener("scroll", requestHeroPhoneUpdate, { passive: true });
lenis?.on("scroll", requestHeroPhoneUpdate);

function syncFlowScreenScroll() {
  if (!flowViewport) return;
  const maxScroll = flowViewport.scrollHeight - flowViewport.clientHeight;
  if (maxScroll <= 0) return;

  const delayedProgress = (flowScreenProgress - 0.42) / 0.34;
  const clamped = Math.min(1, Math.max(0, delayedProgress));
  const eased = clamped * clamped * (3 - 2 * clamped);

  flowViewport.scrollTop = maxScroll * eased;
}

function syncFlowListScroll(index = activeFlowIndex) {
  if (!flowStepsTrack || !flowStage || index < 0) return;
  const viewportHeight = flowStepsTrack.parentElement?.clientHeight || 0;
  const activeStep = flowSteps[index];
  if (!viewportHeight || !activeStep) return;
  const maxOffset = Math.max(0, flowStepsTrack.scrollHeight - viewportHeight + viewportHeight * 0.46);
  const topFadeAllowance = index === 0 ? 0 : Math.min(96, viewportHeight * 0.14);
  const isLastStep = index === flowSteps.length - 1;
  const activeOffset = Math.min(maxOffset, Math.max(0, activeStep.offsetTop - topFadeAllowance));
  let targetOffset = activeOffset;

  if (isLastStep && flowSteps[index - 1]) {
    const centerOffset = activeStep.offsetTop - (viewportHeight - activeStep.offsetHeight) / 2;
    targetOffset = Math.min(maxOffset, Math.max(activeOffset, centerOffset));
  }

  flowStepsTrack.style.setProperty("--flow-list-offset", `${Math.round(targetOffset * -1)}px`);
}

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const baseTransform = getComputedStyle(card).getPropertyValue("--base-transform").trim();
    const isHeroPhone = card.classList.contains("heroPhone");
    const tiltTransform = isHeroPhone
      ? `translate(${x * 5}px, ${y * 5}px) rotateX(${y * -2}deg) rotateY(${x * 3}deg)`
      : `rotateX(${y * -5}deg) rotateY(${x * 7}deg) translateY(-3px)`;
    card.style.transform = baseTransform ? `${baseTransform} ${tiltTransform}` : tiltTransform;
  });

  card.addEventListener("pointerleave", () => {
    const baseTransform = getComputedStyle(card).getPropertyValue("--base-transform").trim();
    card.style.transform = baseTransform || "";
  });
});

document.querySelectorAll(".magnetic").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion || event.pointerType !== "mouse") return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});

const mobileLayout = window.matchMedia("(max-width: 760px)");
document.querySelectorAll(".primaryButton, .ghostButton, .topFab, .navLinks a").forEach((control) => {
  control.addEventListener("pointerdown", (event) => {
    if (!mobileLayout.matches || prefersReducedMotion || event.button !== 0) return;
    const rect = control.getBoundingClientRect();
    const size = Math.hypot(rect.width, rect.height) * 2;
    const ripple = document.createElement("span");
    ripple.className = "tapRipple";
    ripple.setAttribute("aria-hidden", "true");
    Object.assign(ripple.style, {
      width: `${size}px`, height: `${size}px`,
      left: `${event.clientX - rect.left - size / 2}px`,
      top: `${event.clientY - rect.top - size / 2}px`,
    });
    control.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    window.setTimeout(() => ripple.remove(), 600);
  });
});

const prototypeScreens = document.querySelector(".prototypeScreens");
if (prototypeScreens) {
  const prototypeObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, intersectionRatio }) => {
      target.classList.toggle("isInView", mobileLayout.matches && intersectionRatio >= 0.85);
    });
  }, { root: prototypeScreens, threshold: [0, 0.85, 1] });
  prototypeScreens.querySelectorAll(".prototypeShot").forEach(shot => prototypeObserver.observe(shot));
}

window.addEventListener(
  "scroll",
  () => {
    if (lenis) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  },
  { passive: true },
);

setActiveFlow(0);
syncHeroPhoneScroll();
updateScrollFloatText();
