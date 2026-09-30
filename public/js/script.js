// ============================================================
// FORM SUBMISSIONS — START
// ============================================================

function formDataToObject(formData) {
  const obj = {};

  formData.forEach((value, key) => {
    obj[key] = value;
  });

  return obj;
}


// Generic function to handle form submissions
const handleFormSubmit = async (event, url) => {
  event.preventDefault();

  const form = event.target;
  const clickedButtonValue = event.submitter?.value;

  // Convert form fields to plain object
  const payload = {};

  new FormData(form).forEach((value, key) => {
    payload[key] = value;
  });

  // Add submit button value if needed
  if (clickedButtonValue) {
    payload.submit = clickedButtonValue;
  }

  console.log("Submitting to URL:", url, "with data:", payload);

  const confirmationResult = await Swal.fire({
    title: "Confirm Submission",
    text: "Are you sure you want proceed?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes!",
    cancelButtonText: "No!",
  });

  if (!confirmationResult.isConfirmed) return;

  const loader0 = document.getElementById("loader0");

  if (loader0) {
    loader0.style.display = "block";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (loader0) {
      loader0.style.display = "none";
    }

    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    Swal.fire({
      title: data.title || "Success",
      text: data.message || "Operation completed",
      icon: data.icon || "success",
      confirmButtonText: "OK",
    }).then((result) => {

      if (result.isConfirmed && data.redirect) {
        window.location.href = data.redirect;
      }

    });

  } catch (error) {

    if (loader0) {
      loader0.style.display = "none";
    }

    console.error("Fetch error:", error);

    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
    });
  }
};


// ============================================================
// HOME PAGE LOADER
// ============================================================

const loader = document.getElementById("loader");

function loaderHideFunc() {
  if (loader) {
    loader.style.display = "none";
  }
}


// ============================================================
// USER LOGOUT
// ============================================================

async function handleUserogout(event, url) {

  event.preventDefault();

  // Confirmation before logout
  const confirmationResult = await Swal.fire({
    title: "Confirm Submission",
    text: "Are you sure you want proceed?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes!",
    cancelButtonText: "No!",
  });

  if (!confirmationResult.isConfirmed) {
    return;
  }

  try {

    const response = await fetch(url, {
      method: "POST",
    });

    const data = await response.json();

    console.log(data);

    if (data) {

      Swal.fire({
        title: data.title,
        text: data.message,
        confirmButtonText: "OK",
        icon: data.icon,
      }).then((result) => {

        if (result.isConfirmed) {
          window.location.reload();
        }

      });
    }

  } catch (error) {

    console.error("Error:", error);

    Swal.fire({
      title: "Error",
      text: error.message || "Logout failed",
      icon: "error",
    });
  }
}


// ============================================================
// DOM CONTENT LOADED
// ============================================================

document.addEventListener("DOMContentLoaded", () => {


  // ========================================================
  // 1. OLD LOGIN FORM
  // ========================================================

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      handleFormSubmit(e, "/user/login");
    });
  }


  // ========================================================
  // 2. OLD ADMIN LOGIN FORM
  // ========================================================

  const adminLoginForm =
    document.getElementById("adminLoginForm");

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
      handleFormSubmit(e, "/admin");
    });
  }


  // ========================================================
  // 3. OLD BACK BUTTON
  // ========================================================

  const backbtn = document.getElementById("backbtn");

  if (backbtn) {
    backbtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }


  // ========================================================
  // 4. OLD PAGE LOADER
  // ========================================================

  loaderHideFunc();


  // ========================================================
  // 5. METRIC COUNTER ANIMATION
  // ========================================================

  const counters = document.querySelectorAll(
    ".metric-number, .onboarded-number"
  );

  const speed = 40;

  const animateCounter = (counter) => {

    const target =
      +counter.getAttribute("data-counter");

    let count = 0;

    const increment =
      Math.max(1, Math.ceil(target / speed));

    const updateCount = () => {

      count += increment;

      if (count < target) {

        counter.innerText = count;

        setTimeout(updateCount, 25);

      } else {

        counter.innerText = target;
      }
    };

    updateCount();
  };


  const observer = new IntersectionObserver(
    (entries, obs) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          animateCounter(entry.target);

          obs.unobserve(entry.target);
        }
      });

    },
    {
      threshold: 0.5
    }
  );


  counters.forEach((counter) => {
    observer.observe(counter);
  });


  // ========================================================
  // 6. HIGH-PERFORMANCE SWIPE ENGINE
  // ========================================================

  const viewport =
    document.getElementById("swipeViewport");

  const clippedLayer =
    document.getElementById("clippedLayer");

  const dragDivider =
    document.getElementById("dragDivider");

  const resetBtn =
    document.getElementById("resetSwipeBtn");


  let isDragging = false;

  let targetPercentage = 50;

  let rafId = null;


  function renderSwipe() {

    if (clippedLayer) {

      clippedLayer.style.clipPath =
        `inset(0 0 0 ${targetPercentage}%)`;
    }

    if (dragDivider) {

      dragDivider.style.left =
        `${targetPercentage}%`;
    }

    rafId = null;
  }


  function scheduleUpdate(clientX) {

    if (!viewport) return;

    const rect =
      viewport.getBoundingClientRect();

    let offsetX =
      clientX - rect.left;


    if (offsetX < 0) {
      offsetX = 0;
    }

    if (offsetX > rect.width) {
      offsetX = rect.width;
    }


    targetPercentage =
      (offsetX / rect.width) * 100;


    if (!rafId) {

      rafId =
        requestAnimationFrame(renderSwipe);
    }
  }


  const onPointerStart = (e) => {

    isDragging = true;

    if (viewport) {
      viewport.style.cursor = "ew-resize";
    }


    const clientX =
      e.clientX ??
      (e.touches && e.touches[0]?.clientX);


    if (clientX !== undefined) {
      scheduleUpdate(clientX);
    }
  };


  const onPointerMove = (e) => {

    if (!isDragging) return;


    const clientX =
      e.clientX !== undefined
        ? e.clientX
        : e.touches?.[0]?.clientX;


    if (clientX !== undefined) {
      scheduleUpdate(clientX);
    }
  };


  const onPointerEnd = () => {

    isDragging = false;

    if (viewport) {
      viewport.style.cursor = "ew-resize";
    }
  };


  if (viewport) {

    viewport.addEventListener(
      "mousedown",
      onPointerStart
    );

    window.addEventListener(
      "mousemove",
      onPointerMove
    );

    window.addEventListener(
      "mouseup",
      onPointerEnd
    );


    viewport.addEventListener(
      "touchstart",
      onPointerStart,
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      onPointerMove,
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      onPointerEnd
    );
  }


  if (resetBtn) {

    resetBtn.addEventListener("click", () => {

      targetPercentage = 50;

      renderSwipe();
    });
  }


  // ========================================================
  // 7. TECHNICAL FRAMEWORK MODAL TABS
  // ========================================================

  const modalTabs =
    document.querySelectorAll(".modal-tab-btn");

  const tabPanels =
    document.querySelectorAll(".tab-content-panel");


  modalTabs.forEach((btn) => {

    btn.addEventListener("click", () => {

      modalTabs.forEach((tab) => {
        tab.classList.remove("active");
      });


      tabPanels.forEach((panel) => {
        panel.classList.remove("active");
      });


      btn.classList.add("active");


      const targetId =
        btn.getAttribute("data-tab");


      const activePanel =
        document.getElementById(targetId);


      if (activePanel) {
        activePanel.classList.add("active");
      }
    });
  });


  // ========================================================
  // 8. AUTO-CHANGING HERO SATELLITE SLIDESHOW
  // ========================================================

  const heroSlides =
    document.querySelectorAll(".hero-slide-item");

  const slideIndicator =
    document.getElementById("slideIndicator");


  let currentSlide = 0;


  if (heroSlides.length > 0) {

    setInterval(() => {

      heroSlides[currentSlide]
        .classList.remove("active");


      currentSlide =
        (currentSlide + 1) %
        heroSlides.length;


      heroSlides[currentSlide]
        .classList.add("active");


      if (slideIndicator) {

        slideIndicator.innerText =
          `${currentSlide + 1} / ${heroSlides.length}`;
      }

    }, 4000);
  }

});

