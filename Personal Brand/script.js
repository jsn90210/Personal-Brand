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
    document.documentElement.classList.add("klar");
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
    }, 200);
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
    }, 520);
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
}, { threshold: 0, rootMargin: "0px 0px -8% 0px" });

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

// Visar tydligt att meddelandet kom fram
function visaLyckades() {
    formStatus.className = "formstatus lyckades";
    formStatus.textContent = "Tack! Ditt meddelande har skickats. Jag hör av mig inom ett dygn.";
    berattaForGTM("formular_skickat"); // räknas i Google Analytics
}

// Visar tydligt att något gick fel, och ger en annan väg att nå mig
function visaMisslyckades() {
    formStatus.className = "formstatus misslyckades";
    formStatus.innerHTML = 'Meddelandet kunde inte skickas. Mejla mig i stället på <a href="mailto:kontakt@jason-askar.com">kontakt@jason-askar.com</a>.';
}

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

    formStatus.className = "formstatus";

    if (kollaFalt() === false) {
        formStatus.textContent = "Något saknas. Titta på fälten som är markerade.";
        formular.querySelector('[aria-invalid="true"]').focus(); // hoppa till första felet
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
            visaLyckades();
        } else {
            visaMisslyckades();
        }
    } catch (fel) {
        // Hit kommer man t.ex. om en annonsblockerare stoppar anropet till HubSpot
        visaMisslyckades();
    }

    knapp.disabled = false;
}

if (formular !== null) {
    formular.addEventListener("submit", skickaFormular);

    // Ta bort felmarkeringen så fort fältet blir rätt ifyllt
    formular.addEventListener("input", function (event) {
        const ruta = event.target;
        if (ruta.hasAttribute("aria-invalid") && ruta.checkValidity()) {
            ruta.removeAttribute("aria-invalid");
        }
    });
}



/* =========================================================
   5 · Mätning – berättar för Google Tag Manager vad besökaren gör
   =========================================================
   Sajten lägger en "händelse" i dataLayer. Tag Manager plockar
   upp den och skickar den till Google Analytics, men bara om
   besökaren har sagt ja till statistik i cookie-bannern. */

function berattaForGTM(handelse) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: handelse });
}

// Klick på någon av mejl-länkarna
document.querySelectorAll('a[href^="mailto:"]').forEach(function (lank) {
    lank.addEventListener("click", function () {
        berattaForGTM("mejl_klick");
    });
});

// Klick på LinkedIn-länken
document.querySelectorAll('a[href*="linkedin.com"]').forEach(function (lank) {
    lank.addEventListener("click", function () {
        berattaForGTM("linkedin_klick");
    });
});
