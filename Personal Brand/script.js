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


/* =========================================================
   4 · Kontaktformuläret – skickar svaren till HubSpot
   =========================================================
   Formuläret är byggt i sajtens egen HTML så att det ser ut
   som resten av sidan. När man trycker på Skicka skickas
   svaren till HubSpots API, och personen sparas som en
   kontakt i HubSpot. */

const formular = document.querySelector("#kontaktform");
const formStatus = document.querySelector("#formstatus");

// Adressen till HubSpots API: konto-ID och formulär-ID kommer från HubSpot
const hubspotAdress = "https://api-eu1.hsforms.com/submissions/v3/integration/submit/149563971/24a24a49-7dd1-461f-a062-9902e8b3d5ae";

// Kollar att de obligatoriska fälten är rätt ifyllda
function kollaFalt() {
    let alltOk = true;
    const falt = formular.querySelectorAll("input[required]");

    falt.forEach(function (ruta) {
        if (ruta.checkValidity()) {
            ruta.removeAttribute("aria-invalid");
        } else {
            ruta.setAttribute("aria-invalid", "true");
            alltOk = false;
        }
    });

    return alltOk;
}

async function skickaFormular(event) {
    event.preventDefault(); // stoppa webbläsarens vanliga sidomladdning

    // Spamfällan: om det dolda fältet är ifyllt är det en robot
    if (formular.webbplats.value !== "") {
        return;
    }

    if (kollaFalt() === false) {
        formStatus.textContent = "Fyll i namn, mejladress och företag innan du skickar.";
        return;
    }

    const knapp = formular.querySelector("button");
    knapp.disabled = true;
    formStatus.textContent = "Skickar …";

    // Svaren paketeras på det sätt som HubSpot vill ha dem
    const data = {
        fields: [
            { name: "firstname", value: formular.firstname.value.trim() },
            { name: "email", value: formular.email.value.trim() },
            { name: "company", value: formular.company.value.trim() },
            { name: "message", value: formular.message.value.trim() }
        ],
        context: {
            pageUri: window.location.href,
            pageName: document.title
        }
    };

    try {
        const svar = await fetch(hubspotAdress, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (svar.ok) {
            formular.reset();
            formStatus.textContent = "Tack! Jag hör av mig inom ett dygn.";
        } else {
            formStatus.textContent = "Något gick fel. Prova igen eller mejla mig direkt.";
        }
    } catch (fel) {
        formStatus.textContent = "Något gick fel. Prova igen eller mejla mig direkt.";
    }

    knapp.disabled = false;
}

if (formular !== null) {
    formular.addEventListener("submit", skickaFormular);
}
