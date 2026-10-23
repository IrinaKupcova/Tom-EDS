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
    panel.querySelector("[data-title]").textContent = next === "chat" ? "Toms" : "Virtuālais asistents";
    var log = panel.querySelector("[data-log]");
    log.textContent = greetings[next];
  }

  function buildChat() {
    var el = document.createElement("section");
    el.className = "fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col overflow-hidden bg-background";
    el.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 data-title class="text-base font-bold text-primary">Toms</h2><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div>' +
      '<div data-log class="min-h-24 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm"></div>' +
      '<form class="flex gap-2 border-t border-border bg-card p-3"><input data-input class="input-vid min-w-0 flex-1" aria-label="Jautājums" placeholder="Rakstiet jautājumu"><button type="submit" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Sūtīt</button></form>';
    document.body.appendChild(el);
    el.querySelector("[data-close]").addEventListener("click", function () {
      el.hidden = true;
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
      box.className = "fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col bg-background";
      document.body.appendChild(box);
    }
    box.hidden = false;
    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">Pieslēgties EDS</h2><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div>' +
      '<div class="mx-auto mt-8 w-full max-w-[430px] border border-border bg-card p-6">' +
      '<p class="mb-5 text-sm leading-6">Pēc pieslēgšanās varēsiet rakstīt VID speciālistam.</p>' +
      '<button type="button" data-login class="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Pieslēgties EDS</button>' +
      '<p class="mt-3 text-center text-[10px] text-muted-foreground">Pieslēgšanās šajā prototipā tiek demonstrēta.</p></div>';
    box.querySelector("[data-close]").addEventListener("click", function () {
      box.remove();
    });
    box.querySelector("[data-login]").addEventListener("click", showForm);
  }

  function showForm() {
    var box = document.getElementById("local-auth");
    if (!box) return;
    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">Iesniegt dokumentu vai rakstīt speciālistam</h2><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div>' +
      '<form class="mx-auto w-full max-w-3xl px-4 py-6">' +
      '<label class="mb-3 block text-sm text-primary">Tēma<input required data-tema class="input-vid mt-1 w-full"></label>' +
      '<label class="mb-4 block text-sm text-primary">Vēstules teksts<textarea required data-teksts class="input-vid mt-1 h-28 w-full"></textarea></label>' +
      '<div class="flex gap-3"><button type="submit" class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Nosūtīt</button><button type="button" data-close class="rounded-md border border-primary px-4 py-2 text-sm text-primary">Aizvērt</button></div>' +
      "</form>";
    box.querySelectorAll("[data-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        box.remove();
      });
    });
    box.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      var tema = box.querySelector("[data-tema]").value.trim();
      box.remove();
      var note = document.createElement("section");
      note.className = "mx-auto mb-4 max-w-3xl border border-border bg-card p-4";
      note.innerHTML =
        '<h2 class="text-lg font-bold text-primary">Paldies! Jūsu ziņa ir nodota speciālistam.</h2>' +
        '<div class="mt-4 flex flex-wrap gap-3"><div class="rounded-md border-2 border-primary px-4 py-3"><p class="text-base font-bold text-primary">10 darba dienas</p><p class="mt-1 text-xs text-muted-foreground">Parastais termiņš</p></div><div class="rounded-md border-2 border-primary px-4 py-3"><p class="text-base font-bold text-primary">1 mēnesis</p><p class="mt-1 text-xs text-muted-foreground">Sarežģītos gadījumos</p></div></div>' +
        (/grāmatiņ|gramatin/i.test(tema) ? '<p class="mt-4 rounded-md border-2 border-primary bg-warning-surface px-4 py-3 text-sm font-semibold leading-6 text-primary">Vēršam uzmanību, ka šādam pakalpojumam ir veidlapa EDS: “Iesniegums par algas nodokļa grāmatiņas piešķiršanu”.</p>' : "") +
        '<p class="mt-3 text-xs text-muted-foreground">Šī ir demonstrācija — VID speciālists ziņu nesaņem.</p>' +
        '<button type="button" class="mt-4 rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button>';
      note.querySelector("button").addEventListener("click", function () {
        note.remove();
      });
      var main = document.querySelector("main") || document.body;
      main.insertBefore(note, main.firstChild);
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
