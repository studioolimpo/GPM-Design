// Suppress GSAP null/empty target warnings globally
if (typeof gsap !== "undefined" && gsap.config) {
  gsap.config({
    nullTargetWarn: false
  });
}

//  ScrollTrigger.defaults({
//    markers: true
//  });


//document.documentElement.classList.add("no-js");

// Custom ease for visual reveals
const visualRevealEase = CustomEase.create("visualReveal", "0,0,.2,1");
const bgPanelEase = CustomEase.create("bgPanelEase", "0.86,0,0.07,1");
const Transition = CustomEase.create("bgPanelEase", "0.75, 0, 0.15, 1");
const dividerEase = CustomEase.create("dividerEase", "0.65, 0, 0.35, 1");



// Scroll to top immediato su refresh (compatibilità migliorata)
if (window.performance && window.performance.getEntriesByType("navigation")[0]?.type === "reload") {
  window.scrollTo(0, 0);
}
window.history.scrollRestoration = "manual";


let lenis
let ranLoader = sessionStorage.getItem("ranLoader") === "true";
let lineTargets;
let letterTargets;
let splitInstances = [];
let footerScrollTrigger;
let isMobile = window.innerWidth < 550;
let isMobileLandscape = window.innerWidth < 768;
let isTablet = window.innerWidth < 992;
let previousSlug = document.documentElement.getAttribute('data-wf-item-slug');
let previousNamespace = null;

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
  document.documentElement.classList.add("safari");
}


// 1. Inizializzazione Lenis
function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    autoResize: true,
  })

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
}

// Inizializza Lenis
initLenis();

window.addEventListener("load", () => {
  // Forza lo scroll top con scrollRestoration
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // Scroll immediato all'inizio (Lenis + fallback)
  requestAnimationFrame(() => {
    if (window.lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  });
});



/*----------- RESET WEBFLOW -------------*/
function resetWebflow(data) {
  const parser = new DOMParser();
  const dom = $(parser.parseFromString(data.next.html, "text/html")).find("html");
  const webflowPageId = dom.attr("data-wf-page");

  // Reimposta l'ID pagina per Webflow se disponibile
  if (webflowPageId) {
    $("html").attr("data-wf-page", webflowPageId);
  }

  // Reinizializza Webflow IX2 se disponibile
  if (window.Webflow) {
    try {
      window.Webflow.destroy?.();
      window.Webflow.ready?.();
      const ix2 = window.Webflow.require?.("ix2");
      if (ix2 && typeof ix2.init === "function") {
        ix2.init();
      }
      window.Webflow.redraw?.up?.();
    } catch (error) {
      console.warn("Webflow initialization error:", error);
    }
  }

  // Rimuove e riapplica la classe corrente per i link
  $(".w--current").removeClass("w--current");
  $("a").each(function () {
    if ($(this).attr("href") === window.location.pathname) {
      $(this).addClass("w--current");
    }
  });

  // Esegue eventuali script inline con data-barba-script
  dom.find("[data-barba-script]").each(function () {
    let codeString = $(this).text();

    if (codeString.includes("DOMContentLoaded")) {
      codeString = codeString
        .replace(/window\.addEventListener\("DOMContentLoaded",\s*\(\s*event\s*\)\s*=>\s*{\s*/, "")
        .replace(/\s*}\s*\);\s*$/, "");
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    const srcAttr = $(this).attr("src");
    if (srcAttr) script.src = srcAttr;
    script.text = codeString;

    document.body.appendChild(script).remove();
  });
}



function resetScroll() {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill(true));
  ScrollTrigger.clearMatchMedia();
  ScrollTrigger.refresh();
}

/*------- MEGA MENU ------*/
function initMenu() {
    CustomEase.create("main", "0.33, 0, 0.13, 1");

    gsap.defaults({
      ease: "main",
      duration: 0.7
    });

    let navWrap = document.querySelector(".nav_wrap");
    let state = navWrap.getAttribute("data-nav");
    let overlay = navWrap.querySelector(".nav_overlay");
    let menu = navWrap.querySelector(".nav_menu");
    let bgPanels = navWrap.querySelectorAll(".nav_menu_panel");
    let menuToggles = document.querySelectorAll("[data-menu-toggle]");
    let menuLinks = navWrap.querySelectorAll(".u-text-style-h2");
    let menuIndexs = navWrap.querySelectorAll(".u-text-style-main");
    let menuButton = document.querySelector(".menu_button_wrap");
    let menuButtonLayout = menuButton.querySelectorAll(".menu_button_layout");
    let menuDivider = navWrap.querySelectorAll(".nav_menu_divider");
    let menuList = navWrap.querySelector(".nav_menu_list");
    let navTransition = navWrap.querySelector(".nav_transition");

    let tl = gsap.timeline();

    const openNav = () => {
      navWrap.setAttribute("data-nav", "open");
      tl.clear()
        .set(navWrap, { display: "block" })
        .set(menu, { yPercent: 0 }, "<")
        .set(navTransition, { autoAlpha: 0 }, "<")
        .fromTo(menuButtonLayout, { yPercent: 0 }, { yPercent: -120, duration: 0.7, ease: "power3.out"}, "<")
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, "<")
        .fromTo(bgPanels, { yPercent: -101 }, { yPercent: 0, duration: 1, ease:bgPanelEase  }, "<");
      // Always re-select main to ensure it's fresh after Barba transitions
      let main = document.querySelector('[data-barba="container"]');
      tl.fromTo(main, {y: 0},{y: "10rem", duration: 1, ease: bgPanelEase },"<")
        .fromTo(menuList, { yPercent: 20 }, { yPercent: 0 }, "<0.4")
        .fromTo(menuDivider, { opacity: 0, transformOrigin: "left" }, { opacity: 1, stagger: 0.01 , duration: 0.7 }, "<")
        .fromTo(menuIndexs, {autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, stagger: 0.05 }, "<")
        .fromTo(menuLinks, { autoAlpha: 0, }, { autoAlpha: 1, duration: 0.9, stagger: 0.05 }, "<0.1");
    };

    const closeNav = () => {
      navWrap.setAttribute("data-nav", "closed");
      tl.clear()
        .to(overlay, { autoAlpha: 0 })
        .to(menu, { yPercent: -110 }, "<");
      // Always re-select main to ensure it's fresh after Barba transitions
      let main = document.querySelector('[data-barba="container"]');
      tl.to(main, { y: 0 }, "<")
        .to(menuButtonLayout, { yPercent: 0, duration: 0.7, ease: "power3.out" }, "<")
        .set(navWrap, { display: "none" });
    };

    const transitionNav = () => {
        navWrap.setAttribute("data-nav", "closed");
        tl.clear()
          .to(overlay, { autoAlpha: 0, delay: 0.3 })
          // .to(navTransition, { autoAlpha: 1, duration: 0.5 }, "<")
          .to(menu, { yPercent: -110, duration:0.9 , ease: "power2.out" }, "<")
          .to(menuButtonLayout, { yPercent: 0, duration: 0.7, ease: "power3.out" }, "<0.2")
          .set(navWrap, { display: "none" });
        // Always re-select main to ensure it's fresh after Barba transitions
        let main = document.querySelector('[data-barba="container"]');
        tl.to(main, { y: 0 }, "<");
      };

    menuToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        state = navWrap.getAttribute("data-nav");
        if (state === "open") {
          closeNav();
          lenis.start();
        } else {
          openNav();
          lenis.stop();
        }
      });
    });

    $("a").on("click", function (e) {
    const href = $(this).attr("href");
    const isSameHost = $(this).prop("hostname") === window.location.host;
    const isNotHash = href.indexOf("#") === -1;
    const isNotBlank = $(this).attr("target") !== "_blank";
    const isNavOpen = navWrap.getAttribute("data-nav") === "open";

    const currentPath = window.location.pathname.replace(/\/$/, "");
    const targetPath = new URL(href, window.location.origin).pathname.replace(/\/$/, "");

    if (isSameHost && isNotHash && isNotBlank && isNavOpen) {
      if (currentPath === targetPath) {
        e.preventDefault();
        closeNav();
        lenis.start();
      } else {
        e.preventDefault();
          transitionNav();
          lenis.start();
      }
    }
  });

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const listItems = navWrap.querySelectorAll(".nav_menu_link");
    const imageItems = document.querySelectorAll(".nav_visual_item");

    if (listItems.length && imageItems.length) {
      gsap.set(imageItems, { autoAlpha: 0 });

      listItems.forEach((listItem, i) => {
        listItem.addEventListener("mouseenter", () => {
          imageItems.forEach((img, index) => {
            gsap.killTweensOf(img);
            gsap.to(img, {
              autoAlpha: index === i ? 1 : 0,
              duration: 0.5,
              overwrite: true
            });
          });
        });

        listItem.addEventListener("mouseleave", () => {
          imageItems.forEach((img) => {
            gsap.killTweensOf(img);
            gsap.to(img, {
              autoAlpha: 0,
              duration: 0.3,
              overwrite: true
            });
          });
        });
      });
    }
  }
}


/*------- FOOTER REVEAL ------*/
function initFooterReveal() {
  const section = document.querySelector('.footer_reveal_section');
  const target = section?.querySelector('.footer_reveal_target');
  if (!section || !target) return;

  gsap.set(target, { yPercent: -50 });

  // salva lo ScrollTrigger
  footerScrollTrigger = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    scrub: true,
    animation: gsap.to(target, {
      yPercent: 0,
      ease: 'none'
    })
  });
}

/*-------- FOOTER DESTROY REVEAL ----------*/
function destroyFooterReveal() {
  if (footerScrollTrigger) {
    footerScrollTrigger.kill();
    footerScrollTrigger = null;
  }
}

/*------- FOOTER REVEAL CONDITION ------*/
function shouldRevealFooter() {
  return window.matchMedia("(min-width: 60em)").matches;
}

/*------- LOADER ------*/
function initLoader() {
  let loaderWrap = document.querySelector(".loader_wrap");

  if (!loaderWrap) return;

  lenis.stop();
  window.scrollTo(0, 0);

  // Prevent flash: show loader and set opacity, but leave zIndex to CSS
  loaderWrap.style.display = "block";
  loaderWrap.style.opacity = "1";

  const loaderLogo = document.querySelector(".loader_logo");
  if (loaderLogo) loaderLogo.style.visibility = "visible";
  let loaderLettersNodeList = loaderWrap.querySelectorAll(".loader_logo_letter");
  let loaderLetters = Array.from(loaderLettersNodeList || []).filter(Boolean);

  let loaderLogoText = loaderWrap.querySelectorAll(".loader_logo_text");
  let loaderText = loaderWrap.querySelectorAll(".loader_text");
  let loaderArrow = loaderWrap.querySelector(".loader_logo_arrow");


  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => {
      loaderWrap.style.display = "none";
      lenis.start();
      ranLoader = true;
    }
  });

  

  // tl.set(loaderWrap, { opacity: 1 });
  tl.set(loaderWrap.querySelectorAll("[data-prevent-flicker='true']"), { visibility: "visible" });
  
  if (loaderLetters.length > 0) {
    tl.fromTo(
      loaderLetters,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.15,
        force3D: true
      },
      "<0.5"
    );
  }

  if (loaderArrow) {
    tl.fromTo(
      loaderArrow,
      { scaleX: 0 },
      {
        scaleX: 1,
        transformOrigin: "left",
        duration: 2,
        ease: "power2.out"
      },
      "<0.5"
    );
  }

  if (loaderLogoText.length > 0) {
    tl.fromTo(
      loaderLogoText,
      { yPercent: 120 },
      {
        yPercent: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.2,
        force3D: true
      },
      "<0.4"
    );
  }

  if (loaderText.length > 0) {
    tl.fromTo(
      loaderText,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 1.2,
      },
      "<0.6"
    );
  }

  tl.to(
    loaderWrap,
    { y: "-100%", duration: 1, ease: "power3.inOut" },
    "<0.8"
  );

  

  // Scroll controllato con Lenis dopo l'uscita del loader
  tl.call(() => {
    if (lenis && ranLoader === false) {
      lenis.scrollTo(0, {
        duration: 0,
        easing: CustomEase.create("easeOutWiggle", "0.65, 0, 0.35, 1")
      });

      setTimeout(() => {
        lenis.scrollTo(0, {
          duration: 1.2,
          easing: t => 1 - Math.pow(1 - t, 3)
        });
      }, 0);
    }
  }, null, "<");
}


function runSplit(next) {
  next = next || document;

  const lineTargets = next.querySelectorAll("[data-split-line='true']");

  // Revert eventuale
  if (typeof splitInstances !== "undefined" && splitInstances.length) {
    splitInstances.forEach(split => split.revert());
  }

  splitInstances = [];

  document.fonts.ready.then(() => {
      lineTargets.forEach((el) => {
        if (!el.children.length) return;

        const split = new SplitText(el.children, {
          type: "lines",
          autoSplit: true,
          mask: "lines",
          linesClass: "line",
          clearProps: "all",
        });

        splitInstances.push(split);
      });
      next.querySelectorAll("[data-line-reveal='true']").forEach((text) => {
        gsap.set(text, { visibility: "visible" });
      });
  });
}

/*---------- CURSOR CUSTOM -------*/
function initCustomCursor() {
  const cursor = document.querySelector(".cursor");
  if (!cursor) {
    return;
  }

  let cursorRevealed = false;
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });

  cursor.classList.add("cursor_hide");

  let xTo = gsap.quickTo(cursor, "x", { duration: 0.7, ease: "power3.out" });
  let yTo = gsap.quickTo(cursor, "y", { duration: 0.7, ease: "power3.out" });

  window.addEventListener("mousemove", (e) => {
    xTo(e.clientX);
    yTo(e.clientY);

    if (!cursorRevealed) {
      cursor.classList.remove("cursor_hide");
      cursorRevealed = true;
    }
  });
}

/*---------- CURRENT YEAR -------*/
function initDynamicCurrentYear() { 
  const currentYear = new Date().getFullYear();
  const currentYearElements = document.querySelectorAll('[data-current-year]');
  currentYearElements.forEach(currentYearElement => {
    currentYearElement.textContent = currentYear;
  });
}

/*------ SUBMIT FORM TRIGGER -----*/
function SubmitSuccessPopup() {
  const overlay = document.querySelector(".form_popup_wrap");
  const panel = overlay?.querySelectorAll(".form_popup_bg");
  const inner = overlay?.querySelectorAll(".form_popup_inner");
  const form = document.querySelector("form");

  if (!overlay || !panel || !inner || !form) return;

  $(document).on("ajaxComplete", function () {
    // Nasconde il messaggio Webflow e riporta il form
    form.style.display = "flex";

    if (lenis) lenis.stop();

    gsap.set(overlay, {
      display: "flex",
      visibility: "visible",
      yPercent: 0,
    });

    gsap.set(inner, { opacity: 0 });

    const tl = gsap.timeline();

    tl.fromTo(panel, { yPercent: -101 }, { yPercent: 0, duration: 1, ease: bgPanelEase });

    tl.to(inner, {
      opacity: 1,
      duration: 0.9,
      stagger: 0.07,
    }, "<0.5");

    tl.to(overlay, {
      duration: 1.1,
      ease: bgPanelEase,
      yPercent: -101,
      delay: 1.6,
      onStart: () => {
        if (lenis) lenis.start();
        if (window.barba) {
          barba.go("/");
          cmsNest();
        } else {
          window.location.href = "/";
        }
      },
      onComplete: () => {
        tl.set(overlay, { display: "none" });
      }
    });
  });
}


/*---------- SIGNATURE -------*/
function Signature() {
    if (ranLoader === false) { 
      console.log("%cCredits: Studio Olimpo – https://www.studioolimpo.it", "background: #F8F6F1; color: #000; font-size: 12px; padding:10px 14px;");
    }
  }

/*------- ADD COMMA TO TAG ------*/

function addCommaBetweenTwoTags(next) {
  next = next || document;

  next.querySelectorAll(".hero_project_tag_list").forEach(tagList => {
    // Rimuove eventuali virgole precedenti
    tagList.querySelectorAll(".injected-comma").forEach(el => el.remove());

    const firstTag = tagList.querySelector(".hero_project_tag_text");
    if (firstTag) {
      const commaSpan = document.createElement("span");
      commaSpan.classList.add("injected-comma");
      commaSpan.textContent = ", ";
      firstTag.appendChild(commaSpan);
    }
  });
}
  




/*==========================================*\
  ================ HERO ANIMATION ==============
\*==========================================*/

/*-------------- HERO HOME -------------*/
function initHeroHomeAnimation() {
  document.querySelectorAll(".hero_main_wrap").forEach((section) => {
    const image = section.querySelector(".g_visual_wrap");
    const content = section.querySelector(".hero_main_layout");

    if (!image || !content) return;

    const tl = gsap.timeline();
    tl.fromTo(
      image,
      { scale: 1.2 },
      {
        scale: 1,
        duration: 1.4,
        ease: "power3.out",
        delay: ranLoader ? 0 : 2.8,
      }
    );
    tl.from(content, {y: "8rem", duration: 0.8,  ease: "power3.out" }, "<0.2");

    gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), { visibility: "visible" });
  });
}

/*-------------- HERO PROJECTS -------------*/
function initHeroProjectsAnimation() {
  const section = document.querySelector("#hero-projects");  
  if (!section) return;

  // Non fare di nuovo SplitText — lo ha già fatto runSplit
  const lines = section.querySelectorAll(".line");
  if (!lines.length) return;

  const tl = gsap.timeline();
  // tl.restart(true);
  tl.fromTo(lines, {
    yPercent: 110,
  }, {
    yPercent: 0,
    duration: 0.7,
    ease: "power3.out",
    delay: ranLoader ? 0 : 2.6,
    stagger: { amount: 0.2 },
  });

   gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), {
     visibility: "visible",
   });
  
  return tl;
}

/*-------------- HERO SINGLE PROJECT -------------*/
function initHeroSingleProjectAnimation(next) {
  next = next || document;
  const section = next.querySelector(".hero_project_wrap");
  if (!section) return;

  const heading = section.querySelector(".hero_project_heading");
  if (!heading) return;

  const wrap = section.querySelector(".g_visual_wrap");
  if (!wrap) return;

  const image = section.querySelector(".g_visual_img");
  if (!image) return;

  const visualbg = section.querySelector(".g_visual_background");

  gsap.set(wrap , {
    autoAlpha: 0,
  });
   gsap.set(heading, {
    clearProps: "all",
  });

  // Reset innerHTML to prevent duplicate SplitText instances
  heading.innerHTML = heading.textContent;

  if (!heading || !heading.textContent.trim()) return;

  // Split heading into lines
  let lines = [];
  try {
    lines = SplitText.create(heading, {
      type: "lines",
      autoSplit: true,
      mask: "lines",
      linesClass: "line",
    }).lines;
  } catch (e) {
    console.warn("SplitText failed:", e);
    return;
  }
  if (!lines.length) return;

  // Prevent flicker
  gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), {
    visibility: "visible",
  });

  // Set initial state for wrap and image
  gsap.set(wrap, {
    clipPath: "inset(100% 0% 0% 0%)",
    webkitClipPath: "inset(100% 0% 0% 0%)",
    visibility: "visible",
    autoAlpha: 1,
  });

  gsap.set(image, {
    opacity: 0,
    yPercent: 5,
  });

  const tl = gsap.timeline();

  // Animate heading lines
  tl.from(lines, {
    yPercent: 110,
    duration: 0.9,
    ease: "power3.out",
    delay: ranLoader ? 0 : 2.5,
    stagger: { amount: 0.2 },
  });

  // Animate visual wrap
  tl.to(wrap, {
    clipPath: "inset(0% 0% 0% 0%)",
    webkitClipPath: "inset(0% 0% 0% 0%)",
    ease: visualRevealEase,
    duration: 0.9,
  }, "<0.2");

  // Animate image
  tl.to(image, {
    opacity: 1,
    yPercent: 0,
    duration: 0.7,
    ease: visualRevealEase,
  }, "<0.3");

  // Animate background if present
  if (visualbg) {
    tl.to(visualbg, {
      opacity: 0,
      duration: 1,
      ease: visualRevealEase,
    }, "<0.2");
  }

  return tl;
}

/*-------------- HERO STUDIO -------------*/
function initHeroStudioAnimation() {
  const section = document.querySelector(".hero_studio_wrap");
  if (!section) return;

  const layout = section.querySelector(".hero_studio_contain");
  const headings = section.querySelectorAll(".g_heading");
  const wrap = section.querySelector(".g_visual_wrap");
  const image = section.querySelector(".g_visual_img");
  const visualbg = section.querySelector(".g_visual_background");
  const dividers = section.querySelectorAll(".hero_studio_divider");

  if (!layout || !headings.length || !wrap || !image) return;

  // Forza visibilità degli elementi
  gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), {
    visibility: "visible",
  });

  // Inizializza divider (origin alternati)
  dividers.forEach((el, i) => {
    gsap.set(el, {
      scaleX: 0,
      transformOrigin: i % 2 === 0 ? "right" : "left",
    });
  });

  // Visual iniziale
  gsap.set(wrap, {
    clipPath: "inset(100% 0% 0% 0%)",
    webkitClipPath: "inset(100% 0% 0% 0%)",
    visibility: "visible",
  });

  gsap.set(image, {
    opacity: 0,
    yPercent: 5,
  });

  // Recupera linee già splittate (runSplit è stato chiamato prima)
  const lines = section.querySelectorAll(".line");
  if (!lines || lines.length === 0) return;

  const tl = gsap.timeline();

  tl.from(layout, {
    y: "10rem",
    duration: 0.5,
    delay: ranLoader ? 0 : 2.8,
    ease: "power3.out"
  });

  tl.to(wrap, {
    clipPath: "inset(0% 0% 0% 0%)",
    webkitClipPath: "inset(0% 0% 0% 0%)",
    ease: visualRevealEase,
    duration: 0.6,
  }, "<0.2");

  tl.to(image, {
    opacity: 1,
    yPercent: 0,
    duration: 0.5,
    ease: visualRevealEase,
  }, "<0.1");

  tl.to(dividers, {
    scaleX: 1,
    duration: 0.9,
    stagger: 0.06,
    ease: dividerEase,
  }, "<0.2");

  if (visualbg) {
    tl.to(visualbg, {
      opacity: 0,
      duration: 0.9,
      ease: visualRevealEase,
    }, "<0.2");
  }

  tl.from(lines, {
    yPercent: 110,
    duration: 0.7,
    ease: "power3.out",
    stagger: { amount: 0.3 },
  }, "<0.1");

  return tl;
}

/*-------------- HERO PROCESS -------------*/
function initHeroProcessAnimation() {
  const section = document.querySelector("#hero-process");
  if (!section) return;

  // Forza visibilità per evitare flicker nel caso in cui SplitText non parta
  gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), {
    visibility: "visible",
  });

  // Seleziona le linee già splittate
  const lines = section.querySelectorAll(".line");
  if (!lines.length) return;

  // Anima le linee
  const tl = gsap.timeline();
  tl.from(lines, {
    yPercent: 110,
    duration: 0.7,
    ease: "power3.out",
    delay: ranLoader ? 0.1 : 2.8,
    stagger: { amount: 0.2 },
  });

  return tl;
}

/*-------------- HERO CONTACT -------------*/
function initHeroContactAnimation() {
  const section = document.querySelector("#hero-contact");
  const sectionForm = document.querySelector(".contact_form_wrap");
  if (!section) return;

  // Forza visibilità per evitare flicker nel caso in cui SplitText non parta
  gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), {
    visibility: "visible",
  });

  // Seleziona le linee già splittate
  const lines = section.querySelectorAll(".line");
  if (!lines.length) return;

  // Anima le linee
  const tl = gsap.timeline();
  tl.from(lines, {
    yPercent: 110,
    duration: 0.7,
    ease: "power3.out",
    delay: ranLoader ? 0.4 : 2.9,
    stagger: { amount: 0.2 },
  });

  tl.from(sectionForm, {
    y: "5rem",
    opacity: 0,
    duration: 0.7,
    ease: "power3.out"
  }, "<0.45")

  return tl;
}


/*-------------- HERO 404 -------------*/
function initHero404Animation() {
  const section = document.querySelector("#hero-error");  
  if (!section) return;

  // Non fare di nuovo SplitText — lo ha già fatto runSplit
  const lines = section.querySelectorAll(".line");
  if (!lines.length) return;


  const tl = gsap.timeline();
  // tl.restart(true);
  tl.fromTo(lines, {
    yPercent: 110,
  }, {
    yPercent: 0,
    duration: 0.7,
    ease: "power3.out",
    delay: ranLoader ? 0.4 : 3.3,
    stagger: { amount: 0.2 },
  });

   gsap.set(section.querySelectorAll("[data-prevent-flicker='true']"), {
     visibility: "visible",
   });
  
  return tl;
}

/*==========================================*\
  ================ PAGE SCROLL ==============
\*==========================================*/

/*-------------- CIRCLE LED -------------*/
function initCircleAnimation(next) {
  next = next || document;
  next.querySelectorAll("[data-circle-reveal='true']").forEach((circle) => {
    gsap.set(circle, { opacity: 0 });

    gsap.timeline({
      scrollTrigger: {
        trigger: circle,
        start: "top 95%",
        toggleActions: "play none none none"
      }
    })
    .to(circle, { opacity: 1, duration: 0.05, ease: "none" })
    .to(circle, { opacity: 0, duration: 0.05, delay: 0.07, ease: "none" })
    .to(circle, { opacity: 1, duration: 0.05, delay: 0.12, ease: "none" })
    .to(circle, { opacity: 0, duration: 0.05, delay: 0.06, ease: "none" })
    .to(circle, { opacity: 1, duration: 0.05, ease: "none" });
  });
}

/*-------------- LINE TEXT REVEAL -------------*/
function initLineReveal(next) {
  next = next || document;



  next.querySelectorAll("[data-line-reveal='true']").forEach((text) => {
    const lines = text.querySelectorAll(".line");
    if (!lines.length) return;

    gsap.from(lines, {
      yPercent: 110,
      delay: 0.1,
      duration: 0.7,
      ease: "expo.out",
      stagger: { amount: 0.3 },
      scrollTrigger: {
        trigger: text,
        start: "top bottom",
        end: "top 95%",
        toggleActions: "none play none reset",
      },
    });
  });
}

/*-------------- DIVIDER LINE REVEAL -------------*/
function initDividerReveal(next) {
  next = next || document;
  next.querySelectorAll("[data-divider-reveal='true']").forEach((divider) => {
    gsap.set(divider, { scaleX: 0.3, transformOrigin: "left" });

    gsap.timeline({
      scrollTrigger: {
        trigger: divider,
        start: "top 99%",
        toggleActions: "play none none none"
      }
    })
    .to(divider, {
      scaleX: 1,
      duration: 1,
      ease: CustomEase.create("dividerEase", "0.65, 0, 0.35, 1")
    });
  });
}

/*-------------- VISUAL REVEAL -------------*/
function initImageReveal(next) {
  next = next || document;
  const allWraps = next.querySelectorAll("[data-image-reveal='true']");
  if (!allWraps.length) return;

  allWraps.forEach((wrap, index) => {
    if (!wrap) return;
    const image = wrap.querySelector(".g_visual_img");
    if (!image) return;
    const visualbg = wrap.querySelector(".g_visual_background");

    // Imposta visibilità e clip iniziale
    gsap.set(wrap, {
      clipPath: "inset(100% 0% 0% 0%)",
      webkitClipPath: "inset(100% 0% 0% 0%)",
      visibility: "visible"
    });

    gsap.set(image, {
      opacity: 0,
      yPercent: 5,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 99%",
        toggleActions: "play none none none"
      }
    });

    // Se non hai gruppi, puoi usare solo l'index per lo stagger
    const staggerDelay = index * 0.05;

    tl.to(wrap, {
      clipPath: "inset(0% 0% 0% 0%)",
      webkitClipPath: "inset(0% 0% 0% 0%)",
      ease: visualRevealEase,
      duration: 0.9,
      delay: staggerDelay
    }, 0);

    tl.to(image, {
      opacity: 1,
      yPercent: 0,
      duration: 0.7,
      ease: visualRevealEase
    }, "<0.3");

    if (visualbg) {
      tl.to(visualbg, {
        opacity: 0,
        duration: 1,
        ease: visualRevealEase
      }, "<0.2");
    }
  });
}


/*------- FADE IN -------*/
function fadeInOnScroll(next) {
  next = next || document;
  const elements = next.querySelectorAll('[data-fade-in="true"]');

  elements.forEach(el => {
    gsap.fromTo(el,
      {
        autoAlpha: 0,
        y: "3.5rem"
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
          once: true
        }
      }
    );
  });

  ScrollTrigger.refresh();
}


/*-------------- ANIMATE THEME SCROLL -------------*/
function initThemeScroll(next) {
  next = next || document;
  function setupThemeTriggers() {
    const elements = next.querySelectorAll("[data-animate-theme-to]");
    if (!elements.length) return;
    elements.forEach((el) => {
      const theme = el.getAttribute("data-animate-theme-to");
      const brand = el.getAttribute("data-animate-brand-to");

      ScrollTrigger.create({
        trigger: el,
        start: "top center",
        end: "bottom center",
        onToggle: ({ isActive }) => {
          if (
            isActive &&
            typeof window.colorThemes !== "undefined" &&
            typeof window.colorThemes.getTheme === "function"
          ) {
            const themeData = window.colorThemes.getTheme(theme, brand);
            if (themeData) {
              gsap.to("body", {
                ...themeData,
                duration: 0.4,
                ease: "power1.out",
                overwrite: "auto",
              });
            }
          }
        },
      });
    });
  }

  // Se colorThemes è già disponibile
  if (typeof window.colorThemes !== "undefined") {
    setupThemeTriggers();
  } else {
    // Altrimenti aspetta che venga lanciato l’evento custom
    document.addEventListener("colorThemesReady", setupThemeTriggers, { once: true });
  }
} 

/*-------------- RESET THEME SCROLL -------------*/
function resetTheme(next) {
  next = next || document;
  if (typeof colorThemes?.getTheme === "function") {
    const lightTheme = colorThemes.getTheme("light");

    if (lightTheme) {
      gsap.to("body", {
        ...lightTheme,
        duration: 0.4,
        overwrite: "auto"
      });
    }
  }
}

/*-------------- PARALLAX BACKGROUND -------------*/
function initParallaxSections(next) {
  next = next || document;

  next.querySelectorAll("[data-scroll-overlap='true']").forEach(section => {
    if (section.dataset.scriptInitialized) return;
    section.dataset.scriptInitialized = "true";

    const previousSection = section.previousElementSibling;
    if (!previousSection) {
      console.warn("No previous section found for", section);
      return;
    }

    // Assicurati che il previousSection stia dietro
    gsap.set(previousSection, {
      position: "relative",
      zIndex: 0,
    });

    gsap.set(section, {
      position: "relative",
      zIndex: 1,
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: () =>
          section.offsetHeight < window.innerHeight
            ? "bottom " + window.innerHeight
            : "top " + window.innerHeight,
        end: "top top",
        scrub: true
      }
    }).to(previousSection, { y: "30vh", ease: "none" });
  });
}


/*==========================================*\
  ========== GENERAL CALL FUNCTIONS =========
\*==========================================*/

function initFirstLoading(){
  initLoader();
  initMenu();
  initCustomCursor();
  initDynamicCurrentYear();
  if (shouldRevealFooter()) {
  initFooterReveal();
  }
  initFooterReveal();
}


function initHomeAnimations(next) {
  initLineReveal(next);
  fadeInOnScroll(next);
  //initCircleAnimation(next);
  initDividerReveal(next);
  initProjectsGallerySliders(next);
  initImageReveal(next);
}

function initProjectsAnimations(next) {
  initLineReveal(next);
  //initCircleAnimation(next);
  initDividerReveal(next);
  initImageReveal(next);
}

function initSingleProjectAnimations(next) {
  initLineReveal(next);
  fadeInOnScroll(next);
  //initCircleAnimation(next);
  initDividerReveal(next);
  initProjectsGallerySliders(next);
  initImageReveal(next);
  
}

function initStudioAnimations(next) {
  initLineReveal(next);
  fadeInOnScroll(next);
  //initCircleAnimation(next);
  initDividerReveal(next);
  initImageReveal(next);
  initThemeScroll(next);
  initParallaxSections(next);
}

function initProcessAnimations(next) {
  initLineReveal(next);
    if (!ranLoader) {
    gsap.delayedCall(3.2, fadeInOnScroll, [next]);
  } else {
    fadeInOnScroll(next);
  }
  //initCircleAnimation(next);
  initDividerReveal(next);
  
    if (!ranLoader) {
    gsap.delayedCall(3.3, initImageReveal, [next]);
  } else {
    initImageReveal(next);
  }
}

function initContactAnimations(next) {
  initLineReveal(next);
  fadeInOnScroll(next);
  //initCircleAnimation(next);
  initDividerReveal(next);
  initImageReveal(next);
}

function init404Animations(next) {
  if (typeof next !== "undefined") {
    initLineReveal(next);
    fadeInOnScroll(next);
    //initCircleAnimation(next);
    initDividerReveal(next);
    initImageReveal(next);
  }
}

function initProjectsGallerySliders(next) {
  next = next || document;
  function numberWithZero(num) {
    return num < 10 ? "0" + num : num;
  }

  if (typeof Swiper === "undefined") {
    console.warn("Swiper non è disponibile");
    return;
  }

  next.querySelectorAll(".projects_gallery_layout").forEach((component) => {
    const cmsWrap = component.querySelector(".swiper");
    if (!cmsWrap) return;

    const slides = cmsWrap.querySelectorAll(".swiper-slide:not(.swiper-slide-duplicate)");

    slides.forEach((slide, index) => {
      const currentEl = slide.querySelector(".swiper-number-current");
      if (currentEl) {
        currentEl.textContent = numberWithZero(index + 1);
      }
    });

    const swiper = new Swiper(cmsWrap, {
      slidesPerView: "auto",
      effect: "slide",
      speed: 800,
      slideActiveClass: "is-active",
      slideDuplicateActiveClass: "is-active",
      mousewheel: { forceToAxis: true },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: {
        nextEl: component.querySelector(".team-slider_btn_element.is-next"),
        prevEl: component.querySelector(".team-slider_btn_element.is-prev"),
      },
      pagination: {
        el: component.querySelector(".team-slider_bullet_wrap"),
        bulletActiveClass: "is-active",
        bulletClass: "team-slider_bullet_item",
        bulletElement: "button",
        clickable: true,
      },
      scrollbar: {
        el: component.querySelector(".team-slider_draggable_wrap"),
        draggable: true,
        dragClass: "team-slider_draggable_handle",
        snapOnRelease: true,
      },
    });

    swiper.init?.(); // opzionale, alcune versioni lo richiedono
  });
}

/*--------------- BARBA  ----------------*/
barba.init({
  preventRunning: true,
  //debug: true,
  prefetch: true,
  transitions: [
  {
    name: "default",
    sync: true,
    leave(data) {
      const tl = gsap.timeline({
        defaults: { duration: 0.9, ease: "power2.out" },
      });

      const coverWrap = data.current.container.querySelector(".transition_wrap");

      tl.to(coverWrap, { opacity: 1 }, 0);

      return tl;
    },
    enter(data) {
      const tl = gsap.timeline({
        defaults: { duration: 0.9, ease: "power2.out" },
      });

      const coverWrap = data.next.container.querySelector(".transition_wrap");

      tl.set(coverWrap, { opacity: 0 });
      tl.to(data.current.container, { opacity: 0, duration: 0.6, y: "-10vh" });
      tl.from(data.next.container, { y: "100vh" }, "<");

      return tl;
    }
  }
],
  views: [
    {
  namespace: 'home',
  beforeEnter(data) {
    const next = data.next.container;

    if (!ranLoader) {
      initFirstLoading();         
      cmsNest();                  
      runSplit(next);
      gsap.delayedCall(0.1, initHeroHomeAnimation, [next]);
      gsap.delayedCall(0.4, resetTheme, [next]);
      document.fonts.ready.then(() => {
        gsap.delayedCall(0.3, initHomeAnimations, [next]);
      });
    } else {
      cmsNest();                    // sempre utile
      runSplit(next);              // split solo sul nuovo container
      gsap.delayedCall(0.1, initHeroHomeAnimation, [next]);
      gsap.delayedCall(0.4, resetTheme, [next]);
    }
  },

  afterEnter(data) {
    const next = data.next.container;

    // Esegui solo se non è primo caricamento
    if (ranLoader) {
      gsap.delayedCall(0.6, initHomeAnimations, [next]);
    }
  }
},
    {
  namespace: 'projects',

  beforeEnter(data) {
    const next = data.next.container;

    if (!ranLoader) {
      initFirstLoading();               
      cmsNest();                    
      runSplit(document);            
      gsap.delayedCall(0.2, resetTheme, [next]);
      gsap.delayedCall(0.6, initHeroProjectsAnimation, [next]);
      gsap.delayedCall(3.3, initProjectsAnimations, [next]);
    } else {
      cmsNest();
      runSplit(next);                
      gsap.delayedCall(0.2, resetTheme, [next]);
      gsap.delayedCall(0.5, initHeroProjectsAnimation, [next]);
    }
  },

  afterEnter(data) {
    const next = data.next.container;

    if (ranLoader) {
      gsap.delayedCall(0.1, initProjectsAnimations, [next]);
    }
  }
},
    {
  namespace: 'single-project',

  leave(data) {
    const currentSlug = document.documentElement.getAttribute('data-wf-item-slug');
    previousSlug = currentSlug;
    previousNamespace = 'single-project';
  },

  beforeEnter(data) {
    const nextContainer = data.next.container;

    const htmlString = data.next.html;
    const match = htmlString.match(/<html[^>]*data-wf-item-slug="([^"]+)"/);
    const nextSlug = match ? match[1] : null;

    const currentNamespace = data.current?.namespace;
    const fromOutside = currentNamespace !== 'single-project';
    const slugChanged = nextSlug !== previousSlug;


    // Imposta visibility: hidden solo su questi elementi
    

    // Primo caricamento
    if (!ranLoader) {
      // gsap.set(texts, { visibility: "hidden" });
      initFirstLoading();
      cmsNest();
      runSplit(document);
      gsap.delayedCall(0.7, () => initHeroSingleProjectAnimation(document));
      gsap.delayedCall(0.2, () => resetTheme(nextContainer));
      gsap.delayedCall(2, initSingleProjectAnimations, [nextContainer]);
      
    }

    // Navigazione tra progetti diversi o arrivo da un'altra pagina
    if (ranLoader && (fromOutside || slugChanged)) {
      runSplit(nextContainer);
      gsap.delayedCall(0.7, () => initHeroSingleProjectAnimation(nextContainer));
      gsap.delayedCall(0.2, () => resetTheme(nextContainer));
    }

    previousSlug = nextSlug;
    previousNamespace = 'single-project';
  },

  afterEnter(data) {
    const next = data.next.container;

    if (!ranLoader || previousNamespace !== 'single-project') {
      // Esegui sempre se arrivi da fuori
      gsap.delayedCall(0.5, initSingleProjectAnimations, [next]);
    } else {
      // Evita animazione ridondante se lo slug è lo stesso
      const currentSlug = document.documentElement.getAttribute('data-wf-item-slug');
      if (currentSlug !== previousSlug) {
        gsap.delayedCall(0.1, initSingleProjectAnimations, [next]);
      }
    }
  }
},
   {
  namespace: 'studio',

  beforeEnter(data) {
    const next = data.next.container;

    if (!ranLoader) {
      initFirstLoading(); 
      runSplit(document);    
      gsap.delayedCall(0.2, initHeroStudioAnimation, [next]);
      gsap.delayedCall(0.6, initStudioAnimations, [next]);
    } else {
      runSplit(next);          
      gsap.delayedCall(0.3, initHeroStudioAnimation, [next]);
    }
  },

  afterEnter(data) {
    const next = data.next.container;

    if (ranLoader) {
      gsap.delayedCall(0.6, initStudioAnimations, [next]);
    }
  }
},
    {
  namespace: 'process',

  beforeEnter(data) {
    const next = data.next.container;

    if (!ranLoader) {
      initFirstLoading();
      runSplit(document);
      gsap.delayedCall(0.5, initHeroProcessAnimation, [next]);
      gsap.delayedCall(0.6, initProcessAnimations, [next]);
    } else {
      runSplit(next);
      gsap.delayedCall(0.3, initHeroProcessAnimation, [next]);
    }

    gsap.delayedCall(0.2, resetTheme, [next]);
  },

  afterEnter(data) {
    const next = data.next.container;

    if (ranLoader) {
      gsap.delayedCall(0.2, initProcessAnimations, [next]);
    }
  }
},
    {
      namespace: 'contact',
      beforeEnter(data) {
        let next = data.next.container;
        if (!ranLoader) {
          initFirstLoading();
          runSplit(document);
        }
        runSplit(next);
        gsap.delayedCall(0.4, initHeroContactAnimation, [next]);
        gsap.delayedCall(0.2, resetTheme, [next]);
      },
      afterEnter(data) {
        let next = data.next.container;
        gsap.delayedCall(0.2, initContactAnimations, [next]);
        gsap.delayedCall(0.3, SubmitSuccessPopup, [next]);
      }
    },
    {
      namespace: '404',
      beforeEnter(data) {
        let next = data.next.container;
        if (!ranLoader) {
          initFirstLoading();
           runSplit(document);
        }
        runSplit(next);
        gsap.delayedCall(0.1, initHero404Animation, [next]);
        gsap.delayedCall(0.2, resetTheme, [next]);
      },
      afterEnter(data) {
        let next = data.next.container;
        gsap.delayedCall(0.1, init404Animations, [next]);
      }
    }
  ]
});

barba.hooks.beforeLeave(() => {
  destroyFooterReveal();
});


barba.hooks.enter((data) => {
  resetScroll();
  resetWebflow(data);

  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%"
  });
});

barba.hooks.afterEnter(() => {
  Signature();
  initDynamicCurrentYear();
});

// Hook: reset finale dopo transizione
barba.hooks.after((data) => {

  
  gsap.set(data.next.container, { position: "relative" });

  if (shouldRevealFooter()) {
    initFooterReveal();
  }


  $(window).scrollTop(0);

   if (lenis) {
        lenis.scrollTo(0, { immediate: true });
        lenis.resize();
      }
});