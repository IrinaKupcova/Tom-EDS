(function () {
  if (location.protocol !== "file:") return;
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".fixed.bottom-5").forEach(function (node) {
      node.remove();
    });
    if (location.hash === "#pieslegties") showAuth();
  });

  var channel = "chat";
  var panel = null;

  var greetings = {
    chat: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
    customs: "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu. Par ko vēlaties jautāt?",
    gambling: "Labdien! Palīdzēšu atrast atbildi par azartspēlēm un izlozēm. Par ko vēlaties jautāt?",
  };

  function answer(text) {
    var t = text.toLowerCase();
    if (/speciālist|iesnieg|nosūtīt|rakstīt vid/.test(t)) {
      return "Saprotu, ka vēlaties šo jautājumu nodot VID speciālistam. Vispirms jāpieslēdzas EDS — šī ir demonstrācijas poga, nevis īsta pieteikšanās.";
    }
    if (/grāmatiņ|gramatin/.test(t)) {
      return "Šādam pakalpojumam ir veidlapa EDS: “Iesniegums par algas nodokļa grāmatiņas piešķiršanu”. To var atvērt pēc EDS pieslēgšanās, sadaļā Sarakste ar VID.";
    }
    if (/parād|pārmaks|mans |manu |deklarācij/.test(t)) {
      return "Lai apskatītu jūsu datus, vispirms jāpieslēdzas EDS. Šajā demonstrācijā pēc pieslēgšanās var turpināt jautājumu.";
    }
    if (channel === "customs" || /muit|sūtījum|paka/.test(t)) {
      return "Par pasta sūtījumiem un muitu atbildi var saņemt uzreiz. Ja jālabo deklarācija vai jāraksta muitas punktam, izvēlieties “Rakstīt speciālistam” — pa vidu būs EDS pieslēgšanās.";
    }
    if (channel === "gambling" || /azart|izlož|izloz|licenc|atļauj/.test(t)) {
      return "Par azartspēlēm un izlozēm varu paskaidrot kārtību. Licences, atļaujas vai nodokļa jautājumu speciālistam nodod pēc EDS pieslēgšanās.";
    }
    return "Paldies. Varu palīdzēt ar nodokļu, muitas vai azartspēļu jautājumu. Ja vēstule jānodod speciālistam, vispirms būs EDS pieslēgšanās.";
  }

  function openChat(next) {
    channel = next;
    if (!panel) panel = buildChat();
    panel.hidden = false;
    var page = document.querySelector(".min-h-screen");
    if (page) page.style.paddingRight = "50%";
    panel.querySelector("[data-title]").textContent = next === "chat" ? "Toms" : "Virtuālais asistents";
    var log = panel.querySelector("[data-log]");
    log.textContent = greetings[next];
  }

  function buildChat() {
    var el = document.createElement("section");
    el.className = "fixed bottom-0 right-0 top-12 z-40 flex flex-col overflow-hidden border-l border-border bg-card shadow-[var(--shadow-panel)]";
    el.style.width = "50%";
    el.innerHTML =
      '<div class="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground"><h3 data-title class="text-sm font-bold">Toms</h3><button type="button" data-close class="text-sm" aria-label="Aizvērt">×</button></div>' +
      '<div data-log class="min-h-24 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm"></div>' +
      '<form class="flex gap-2 border-t border-border p-3"><input data-input class="input-vid min-w-0 flex-1" aria-label="Jautājums" placeholder="Rakstiet jautājumu"><button type="submit" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Sūtīt</button></form>';
    document.body.appendChild(el);
    var page = document.querySelector(".min-h-screen");
    if (page) page.style.paddingRight = "50%";
    el.querySelector("[data-close]").addEventListener("click", function () {
      el.hidden = true;
      var page = document.querySelector(".min-h-screen");
      if (page) page.style.paddingRight = "";
    });
    el.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = el.querySelector("[data-input]");
      var text = input.value.trim();
      if (!text) return;
      var log = el.querySelector("[data-log]");
      log.textContent += "\n\nJūs: " + text + "\n\nToms: " + answer(text);
      input.value = "";
      log.scrollTop = log.scrollHeight;
    });
    return el;
  }

  function edsFile() {
    return /[\\/]eds[\\/]index\.html$/i.test(location.pathname);
  }

  function showAuth() {
    var box = document.getElementById("local-auth");
    if (!box) {
      box = document.createElement("section");
      box.id = "local-auth";
      box.className = "mx-auto mt-8 max-w-[430px] border border-border bg-card p-6";
      box.innerHTML =
        '<h2 class="text-base font-bold text-primary">Pieslēgties EDS</h2>' +
        '<p class="mb-5 mt-2 text-sm leading-6">Pēc pieslēgšanās varēsiet rakstīt VID speciālistam.</p>' +
        '<button type="button" data-login class="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Pieslēgties EDS</button>' +
        '<p class="mt-3 text-center text-[10px] text-muted-foreground">Pieslēgšanās šajā prototipā tiek demonstrēta.</p>';
      var main = document.querySelector("main") || document.body;
      main.insertBefore(box, main.firstChild);
      box.querySelector("[data-login]").addEventListener("click", showForm);
    }
    box.hidden = false;
  }

  function showForm() {
    var box = document.getElementById("local-auth");
    if (!box) return;
    box.innerHTML =
      '<h2 class="text-base font-bold text-primary">Iesniegt dokumentu vai rakstīt speciālistam</h2>' +
      '<form class="mt-4">' +
      '<label class="mb-3 block text-sm text-primary">Tēma<input required data-tema class="input-vid mt-1 w-full"></label>' +
      '<label class="mb-4 block text-sm text-primary">Vēstules teksts<textarea required data-teksts class="input-vid mt-1 h-28 w-full"></textarea></label>' +
      '<button type="submit" class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Nosūtīt</button>' +
      "</form>";
    box.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      var tema = box.querySelector("[data-tema]").value.trim();
      box.innerHTML =
        '<h2 class="text-lg font-bold text-primary">Paldies! Jūsu ziņa ir nodota speciālistam.</h2>' +
        '<p class="mt-3 text-sm">Tēma: ' + tema + "</p>" +
        '<p class="mt-3 text-xs text-muted-foreground">Standarta gadījumos cenšamies atbildēt 10 darba dienu laikā. Šī ir demonstrācija — VID speciālists ziņu nesaņem.</p>';
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    var text = button.innerText.replace(/\s+/g, " ");
    if (/speciālistam|Iesniegt dokumentu/.test(text)) {
      event.preventDefault();
      if (edsFile()) showAuth();
      else location.href = "eds/index.html#pieslegties";
      return;
    }
    if (/Pieslēgties EDS/.test(text)) {
      event.preventDefault();
      showForm();
      return;
    }
    if (/nodokļu jomas|virtuālais asistents TOMS/i.test(text)) openChat("chat");
    else if (/muitas jomas/.test(text)) openChat("customs");
    else if (/azartspēļu un izložu jomas/.test(text)) openChat("gambling");
  });
})();
