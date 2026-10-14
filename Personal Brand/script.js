/* =========================================================
   1 · Mörkt läge (temaknappen)
   ========================================================= */

// Hämta knappen och visa den (den är dold i HTML:en)
const temaknapp = document.querySelector("#tema");
temaknapp.hidden = false;

// Slå av/på klassen "morkt" på body och byt knappens text
function bytTema() {
    document.body.classList.toggle("morkt");

    if (document.body.classList.contains("morkt")) {
        temaknapp.textContent = "Ljust läge";
    } else {
        temaknapp.textContent = "Mörkt läge";
    }
}

temaknapp.addEventListener("click", bytTema);


/* =========================================================
   2 · Färgsvepet – övergången mellan sektionerna
   ========================================================= */

const svep = document.querySelector(".wipe");
const svepText = document.querySelector(".wipe__label");

// Respektera besökare som har valt "minska rörelse" i sitt system
const minskaRorelse = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// När sidan har laddat: svepet åker upp och introt glider in
function sidanLaddad() {
    document.body.classList.add("wipe-ut");
    document.body.classList.add("intro-klar");
}

requestAnimationFrame(sidanLaddad);

// Spela rubrikens rad-animation igen
function spelaRubrik(sektion) {
    const rubrik = sektion.querySelector("h2");
    if (rubrik === null) {
        return;
    }
    // Nollställ direkt (utan animation) och starta sedan om
    rubrik.classList.add("aterstall");
    rubrik.classList.remove("syns");
    void rubrik.offsetWidth; // tvingar webbläsaren att rita om
    rubrik.classList.remove("aterstall");
    setTimeout(function () {
        rubrik.classList.add("syns");
    }, 450);
}

// Körs när man klickar på en länk som går till en sektion (#om, #projekt …)
function gaTillSektion(event) {
    const lank = event.currentTarget;
    const mal = document.querySelector(lank.getAttribute("href"));

    // Om sektionen saknas eller man vill ha mindre rörelse: vanlig scroll
    if (mal === null || minskaRorelse) {
        return;
    }

    event.preventDefault();

    // Skriv sektionens namn i svepet
    if (lank.dataset.titel) {
        svepText.textContent = lank.dataset.titel;
    } else {
        svepText.textContent = lank.textContent;
    }

    // Svepet kommer in underifrån
    document.body.classList.remove("wipe-ut");
    document.body.classList.add("wipe-in");

    // När skärmen är täckt: hoppa till sektionen och svep ut igen
    setTimeout(function () {
        document.documentElement.style.scrollBehavior = "auto";
        mal.scrollIntoView();
        document.documentElement.style.scrollBehavior = "";

        history.pushState(null, "", lank.getAttribute("href"));
        mal.focus({ preventScroll: true }); // för tangentbord och skärmläsare

        document.body.classList.remove("wipe-in");
        document.body.classList.add("wipe-ut");
        spelaRubrik(mal);
    }, 950);
}

const sektionsLankar = document.querySelectorAll('a[href^="#"]');

sektionsLankar.forEach(function (lank) {
    lank.addEventListener("click", gaTillSektion);
});


/* =========================================================
   3 · Fade-ins när man scrollar
   ========================================================= */

const saker = document.querySelectorAll("[data-reveal], h2:has(.rad)");

// IntersectionObserver säger till när något kommer in på skärmen
const observator = new IntersectionObserver(function (poster) {
    poster.forEach(function (post) {
        if (post.isIntersecting) {
            post.target.classList.add("syns");
            observator.unobserve(post.target); // animera bara en gång
        }
    });
}, { threshold: 0.15 });

saker.forEach(function (sak) {
    observator.observe(sak);
});
