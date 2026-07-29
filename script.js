document.querySelectorAll(".nav-links a, .contact-links a").forEach((link) => {
  if (link.textContent.trim() === "Telegram") {
    link.href = "https://t.me/annakim_29";
  }
});

if (document.body.classList.contains("home-page") && !window.location.hash) {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  window.scrollTo(0, 0);
  window.addEventListener("pageshow", () => {
    window.scrollTo(0, 0);
  });
}

const desktopJoinWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function unwrapAutomaticJoins() {
  document.querySelectorAll("[data-auto-desktop-join]").forEach((span) => {
    span.replaceWith(...span.childNodes);
  });
}

function getTextTokens(element, skipJoined = true) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const tokens = [];
  let node;

  while ((node = walker.nextNode())) {
    if (skipJoined && node.parentElement?.closest(".keep-together-desktop")) continue;

    for (const match of node.textContent.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      tokens.push({
        node,
        start: match.index,
        end: match.index + match[0].length,
        word: match[0],
        top: range.getBoundingClientRect().top,
      });
    }
  }

  return tokens;
}

function getTextLineCount(element) {
  const lineTops = [];

  getTextTokens(element, false).forEach(({ top }) => {
    if (!lineTops.some((lineTop) => Math.abs(lineTop - top) < 2)) {
      lineTops.push(top);
    }
  });

  return lineTops.length;
}

function applyDesktopJoins() {
  unwrapAutomaticJoins();
  if (window.innerWidth <= 720) return;

  document
    .querySelectorAll("p, h1, h2, h3, h4, li, blockquote, figcaption")
    .forEach((element) => {
      for (let pass = 0; pass < 20; pass += 1) {
        const tokens = getTextTokens(element);
        let candidate;

        for (let index = 0; index < tokens.length - 1; index += 1) {
          const current = tokens[index];
          const next = tokens[index + 1];
          const followingLine = Math.abs(current.top - next.top) >= 2;
          const normalizedWord = current.word.toLowerCase().replace(/[^a-z]/g, "");

          if (
            followingLine &&
            desktopJoinWords.has(normalizedWord) &&
            current.node === next.node
          ) {
            candidate = { current, next };
            break;
          }
        }

        if (!candidate) break;

        const originalLineCount = getTextLineCount(element);
        const range = document.createRange();
        range.setStart(candidate.current.node, candidate.current.start);
        range.setEnd(candidate.next.node, candidate.next.end);

        const span = document.createElement("span");
        span.className = "keep-together-desktop";
        span.dataset.autoDesktopJoin = "";
        range.surroundContents(span);

        if (getTextLineCount(element) > originalLineCount) {
          span.replaceWith(...span.childNodes);
          break;
        }
      }
    });
}

document.fonts.ready.then(applyDesktopJoins);

let desktopJoinResizeFrame;
window.addEventListener("resize", () => {
  cancelAnimationFrame(desktopJoinResizeFrame);
  desktopJoinResizeFrame = requestAnimationFrame(applyDesktopJoins);
});

const emailAddress = "des.yakymchuk@gmail.com";
const emailPopover = document.createElement("div");
emailPopover.className = "email-popover";
emailPopover.setAttribute("role", "dialog");
emailPopover.setAttribute("aria-label", "Email address");
emailPopover.hidden = true;
emailPopover.innerHTML = `
  <span>${emailAddress}</span>
  <button type="button">Copy</button>
`;
document.body.append(emailPopover);

const emailCopyButton = emailPopover.querySelector("button");

function positionEmailPopover(trigger) {
  const triggerRect = trigger.getBoundingClientRect();
  const popoverRect = emailPopover.getBoundingClientRect();
  const pagePadding = 16;
  const desiredLeft = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;

  emailPopover.style.left = `${Math.min(
    window.innerWidth - popoverRect.width - pagePadding,
    Math.max(pagePadding, desiredLeft)
  )}px`;
  emailPopover.style.top = `${triggerRect.bottom + 12}px`;
}

document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    emailPopover.hidden = false;
    emailCopyButton.textContent = "Copy";
    positionEmailPopover(link);
    emailCopyButton.focus();
  });
});

async function copyEmail(button) {
  try {
    await navigator.clipboard.writeText(emailAddress);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = emailAddress;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  button.textContent = "Copied";
}

emailCopyButton.addEventListener("click", () => copyEmail(emailCopyButton));

const footerEmailRow = document.querySelector(".contact-email-row");

if (footerEmailRow) {
  const footerEmailValue = footerEmailRow.querySelector(".contact-email-value");
  const footerEmailButton = footerEmailRow.querySelector(".contact-email-copy");

  function revealFooterEmail() {
    footerEmailRow.classList.add("is-revealed");
    footerEmailRow.setAttribute("role", "group");
    footerEmailRow.removeAttribute("tabindex");
    footerEmailRow.setAttribute("aria-label", "Email address");
    footerEmailValue.textContent = emailAddress;
    footerEmailButton.textContent = "Copy";
    footerEmailButton.setAttribute("aria-label", "Copy email address");
  }

  footerEmailRow.addEventListener("click", (event) => {
    if (!footerEmailRow.classList.contains("is-revealed")) {
      revealFooterEmail();
      event.preventDefault();
    }
  });

  footerEmailRow.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !footerEmailRow.classList.contains("is-revealed")) {
      event.preventDefault();
      revealFooterEmail();
      footerEmailButton.focus();
    }
  });

  footerEmailButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!footerEmailRow.classList.contains("is-revealed")) {
      revealFooterEmail();
      footerEmailButton.focus();
      return;
    }

    copyEmail(footerEmailButton);
  });
}

document.addEventListener("click", (event) => {
  if (
    !emailPopover.hidden &&
    !emailPopover.contains(event.target) &&
    !event.target.closest('a[href^="mailto:"]')
  ) {
    emailPopover.hidden = true;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    emailPopover.hidden = true;
  }
});

window.addEventListener("resize", () => {
  emailPopover.hidden = true;
});

document.querySelectorAll(".work .project-row-linkable").forEach((project) => {
  project.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;

    const projectLink = project.querySelector(".project-media");
    if (projectLink) window.location.href = projectLink.href;
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".mobile-screen-carousel").forEach((carousel) => {
  const slides = [...carousel.children];
  const dots = [...carousel.parentElement.querySelectorAll(".mobile-carousel-dots button")];
  let carouselFrame;

  function setActiveSlide(index) {
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);

      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function updateDots() {
    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    let activeIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(carouselCenter - slideCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    setActiveSlide(activeIndex);
  }

  carousel.addEventListener("scroll", () => {
    cancelAnimationFrame(carouselFrame);
    carouselFrame = requestAnimationFrame(updateDots);
  }, { passive: true });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const slide = slides[index];
      const targetLeft = slide.offsetLeft - (carousel.clientWidth - slide.offsetWidth) / 2;

      carousel.scrollTo({ left: targetLeft, behavior: "smooth" });
      setActiveSlide(index);
    });
  });

  const initialSlide = Number.parseInt(carousel.dataset.initialSlide || "0", 10);

  requestAnimationFrame(() => {
    const slide = slides[initialSlide];

    if (!slide) {
      updateDots();
      return;
    }

    const targetLeft = slide.offsetLeft - (carousel.clientWidth - slide.offsetWidth) / 2;
    carousel.scrollLeft = targetLeft;
    setActiveSlide(initialSlide);
  });
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileMotion = window.matchMedia("(max-width: 720px)").matches;

const homepageHero = document.querySelector(".hero");

if (homepageHero && !reduceMotion) {
  homepageHero.classList.add("hero-motion-ready");

  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          homepageHero.classList.remove("hero-is-exiting");
          homepageHero.classList.add("hero-is-visible");
          if (mobileMotion) {
            heroObserver.unobserve(homepageHero);
          }
        } else {
          if (mobileMotion) return;
          homepageHero.classList.add("hero-is-exiting");
          homepageHero.classList.remove("hero-is-visible");
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    heroObserver.observe(homepageHero);
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => homepageHero.classList.add("hero-is-visible"));
    });
  }
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const revealSections = document.querySelectorAll("main > section:not(.hero)");
  const revealElements = [];

  function addRevealElement(element, index) {
    if (!element || revealElements.includes(element)) return;

    const delay = Math.min(index * 90, 450);
    element.classList.add("reveal-on-scroll");
    element.dataset.revealDelay = `${delay}ms`;
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    revealElements.push(element);
  }

  revealSections.forEach((section) => {
    let sequences;

    if (section.matches(".case-hero")) {
      sequences = [
        [
          section.querySelector(".case-title-block h1"),
          section.querySelector(".case-title-block > p"),
          section.querySelector(".case-meta"),
          section.querySelector(".case-quote"),
          section.querySelector(".case-hero-image"),
        ],
      ];
    } else if (section.matches(".approach")) {
      sequences = [
        [
          section.querySelector(".approach-intro h2"),
          section.querySelector(".approach-intro > p"),
          section.querySelector(".approach-intro > div"),
          ...section.querySelectorAll(".principles > article"),
        ],
      ];
    } else if (section.matches(".work")) {
      sequences = [
        [section.querySelector(":scope > h2")],
        ...[...section.querySelectorAll(".project-list > .project-row")].map(
          (row) => [
            row.querySelector(".project-copy h3"),
            row.querySelector(".project-copy p"),
            row.querySelector(".project-copy .tags"),
            row.querySelector(".project-copy .text-link"),
            row.querySelector(".project-media"),
          ]
        ),
      ];
    } else if (section.matches(".contact")) {
      sequences = [
        [
          section.querySelector(".contact-heading h2"),
          section.querySelector(".contact-heading p"),
        ],
        [...section.querySelectorAll(".contact-links > *")],
      ];
    } else if (section.matches(".case-reflection")) {
      sequences = [
        [
          section.querySelector(".reflection-grid h2"),
          ...section.querySelectorAll(".reflection-grid > div:first-child > p"),
          section.querySelector(".reflection-notes"),
        ],
      ];
    } else if (section.matches(".next-project")) {
      sequences = [
        [
          section.querySelector(":scope > div > h2"),
          section.querySelector(":scope > div > p"),
          section.querySelector(":scope > div > .text-link"),
          section.querySelector(":scope > img"),
        ],
      ];
    } else {
      sequences = [[...section.children]];
    }

    sequences.forEach((sequence) => {
      sequence.filter(Boolean).forEach((element, index) => {
        addRevealElement(element, index);
      });
    });
  });

  document.documentElement.classList.add("motion-ready");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.setProperty(
            "--reveal-delay",
            entry.target.dataset.revealDelay || "0ms"
          );
          entry.target.classList.add("is-visible");
          if (mobileMotion) {
            revealObserver.unobserve(entry.target);
          }
        } else {
          if (mobileMotion) return;
          entry.target.style.setProperty("--reveal-delay", "0ms");
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  const phoneGroups = document.querySelectorAll(`
    .product-experience-scene,
    .supporting-tools-phones,
    .personalization-phones,
    .beyond-community-row,
    .mini-game-row,
    .idea-first-decision-scene,
    .idea-learning-scene,
    .idea-trust-phones
  `);

  phoneGroups.forEach((group) => {
    group.querySelectorAll(".phone-stage, .mini-sketch").forEach((phone, index) => {
      phone.classList.add("phone-reveal");
      phone.dataset.phoneDelay = `${index * 110}ms`;
      phone.style.setProperty("--phone-delay", phone.dataset.phoneDelay);
    });
  });

  document.documentElement.classList.add("phone-motion-ready");

  const phoneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.querySelectorAll(".phone-reveal").forEach((phone) => {
          if (entry.isIntersecting) {
            phone.style.setProperty(
              "--phone-delay",
              phone.dataset.phoneDelay || "0ms"
            );
            phone.classList.add("is-phone-visible");
          } else {
            if (mobileMotion) return;
            phone.style.setProperty("--phone-delay", "0ms");
            phone.classList.remove("is-phone-visible");
          }
        });
        if (entry.isIntersecting && mobileMotion) {
          phoneObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  phoneGroups.forEach((group) => phoneObserver.observe(group));

  const auditFindings = document.querySelectorAll(".idea-audit-board > .audit-finding");

  auditFindings.forEach((finding, index) => {
    finding.classList.add("phone-reveal");
    finding.dataset.phoneDelay = `${Math.max(0, index - 1) * 110}ms`;
    finding.style.setProperty("--phone-delay", finding.dataset.phoneDelay);
  });

  const auditFindingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.setProperty(
            "--phone-delay",
            entry.target.dataset.phoneDelay || "0ms"
          );
          entry.target.classList.add("is-phone-visible");
          if (mobileMotion) {
            auditFindingObserver.unobserve(entry.target);
          }
        } else {
          if (mobileMotion) return;
          entry.target.style.setProperty("--phone-delay", "0ms");
          entry.target.classList.remove("is-phone-visible");
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  auditFindings.forEach((finding) => auditFindingObserver.observe(finding));
}
