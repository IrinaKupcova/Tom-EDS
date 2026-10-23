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
  var domain = "chat";

  var greetings = {
    chat: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
    customs: "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu. Par ko vēlaties jautāt?",
    gambling: "Labdien! Palīdzēšu atrast atbildi par azartspēlēm un izlozēm. Par ko vēlaties jautāt?",
  };

  function answer(text) {
    var t = text.toLowerCase();
    if (/apstrīd|nepiekrīt|sarežģīt/.test(t)) {
      return "Šo nevaru pabeigt kā parastu jautājumu. Zvaniet 67120000 vai pasakiet, ka vēlaties nodot speciālistam. Saruna paliek sarakstes vēsturē 30 dienas.";
    }
    if (/iesniegt|iesnieg|veidlap|izziņ/.test(t)) {
      return "Šo varat izdarīt pats. EDS kreisajā joslā atveriet Dokumenti → Sagatavot dokumentu → No veidlapas. Kur palasīt: https://www.vid.gov.lv/lv un https://eds.vid.gov.lv/login/ . Ja jautājums ir sarežģīts, zvaniet 67120000 vai nododiet speciālistam.";
    }
    if (/speciālist|nosūtīt|rakstīt vid/.test(t)) {
      return "Ja veidlapas nav un vajag cilvēka atbildi, zvaniet 67120000 vai nododiet saraksti speciālistam. Vispirms jāpieslēdzas EDS — šī ir demonstrācijas poga.";
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
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 data-title class="text-base font-bold text-primary">Toms</h2><div class="flex gap-2"><button type="button" data-back class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div></div>' +
      '<div data-log class="min-h-24 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm"></div>' +
      '<form class="flex gap-2 border-t border-border bg-card p-3"><input data-input class="input-vid min-w-0 flex-1" aria-label="Jautājums" placeholder="Rakstiet jautājumu"><button type="submit" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Sūtīt</button></form>';
    document.body.appendChild(el);
    el.querySelector("[data-close]").addEventListener("click", function () {
      el.hidden = true;
    });
    el.querySelector("[data-back]").addEventListener("click", function () {
      el.hidden = true;
      showDomain(domain);
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
      '<p class="mb-4 rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-6">Ja vēlaties iesniegt dokumentu, piemēram, iesniegumu, sākumā izvērtējiet, vai šāda strukturēta veidlapa jau nav pieejama EDS sadaļā DOKUMENTI kreisajā navigācijas joslā.</p>' +
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
        '<div class="mt-4 flex flex-wrap gap-3"><div class="min-w-[220px] flex-1 rounded-md border-2 border-primary px-4 py-3"><p class="text-sm font-bold text-primary">Parastais atbildes termiņš</p><p class="mt-1 text-lg font-bold">10 darba dienas</p></div><div class="min-w-[220px] flex-1 rounded-md border-2 border-primary px-4 py-3"><p class="text-sm font-bold text-primary">Atbildes termiņš sarežģītos gadījumos</p><p class="mt-1 text-lg font-bold">1 mēnesis</p></div></div>' +
        (/grāmatiņ|gramatin/i.test(tema) ? '<p class="mt-4 rounded-md border-2 border-primary bg-warning-surface px-4 py-3 text-sm font-semibold leading-6 text-primary">Vēršam uzmanību, ka šo pakalpojumu varat izdarīt paši EDS sadaļā “Algas nodokļa grāmatiņa”.</p>' : "") +
        '<p class="mt-4 rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-6">Ja vēlaties atsaukt savu ziņojumu, varat to izdarīt sadaļā Sarakstes vēsture.</p>' +
        '<h3 class="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-primary">Ieteikumi</h3>' +
        '<p class="text-sm leading-6">Daudzas darbības varat izdarīt paši — sameklēt skaidrojumu, iesniegt veidlapu vai izgūt izziņu.</p>' +
        '<p class="mt-4 text-sm font-bold">Kā atrast informāciju</p>' +
        '<ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Atveriet <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv" target="_blank" rel="noopener noreferrer">www.vid.gov.lv</a> un meklētājā ierakstiet tēmu.</li><li>Saziņas veidi: <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/klientu-apkalposana" target="_blank" rel="noopener noreferrer">Klientu apkalpošana</a>.</li></ol>' +
        '<p class="mt-4 text-sm font-bold">Kā iesniegt veidlapu</p>' +
        '<ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Pieslēdzieties <a class="font-bold text-primary underline" href="https://eds.vid.gov.lv/login/" target="_blank" rel="noopener noreferrer">EDS</a>.</li><li>Sadaļā Uz sākumu vai Dokumenti izvēlieties Sagatavot dokumentu → No veidlapas, aizpildiet veidlapu un nospiediet Iesniegt.</li><li>Sīkāk: <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/media/1103/download?attachment=" target="_blank" rel="noopener noreferrer">Kā veidot un iesniegt dokumentus EDS</a>.</li></ol>' +
        '<p class="mt-4 text-sm font-bold">Kā izgūt izziņu</p>' +
        '<ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6"><li>EDS sadaļā Izziņas nospiediet Sagatavot jaunu izziņu.</li><li>Pēc saglabāšanas lejupielādējiet PDF. Sīkāk: <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/media/1089/download?attachment=" target="_blank" rel="noopener noreferrer">Kā lietot EDS sadaļu “Izziņas”</a>.</li></ol>' +
        (/grāmatiņ|gramatin/i.test(tema) ? '<p class="mt-4 text-sm font-bold">Kā saņemt un apskatīt algas nodokļa grāmatiņu</p><ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Izlasiet <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/algas-nodokla-gramatina" target="_blank" rel="noopener noreferrer">Algas nodokļa grāmatiņa</a>.</li><li>EDS sadaļā Algas nodokļa grāmatiņa nospiediet Atvērt un pēc tam Saņemt algas nodokļa grāmatiņu.</li></ol>' : "") +
        '<button type="button" class="mt-4 rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button>';
      note.querySelector("button").addEventListener("click", function () {
        note.remove();
      });
      var main = document.querySelector("main") || document.body;
      main.insertBefore(note, main.firstChild);
    });
  }

  function showDomain(next) {
    domain = next;
    var box = document.getElementById("local-domain");
    if (!box) {
      box = document.createElement("section");
      box.id = "local-domain";
      box.className = "fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col bg-background";
      document.body.appendChild(box);
    }
    var titles = { chat: "Nodokļu joma", customs: "Muitas joma", gambling: "Azartspēļu un izložu joma" };
    box.hidden = false;
    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">' + titles[next] + '</h2><div class="flex gap-2"><button type="button" data-back class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div></div>' +
      '<div class="mx-auto grid w-full max-w-3xl gap-3 px-4 py-6 sm:grid-cols-2">' +
      '<button type="button" data-assistant class="rounded-lg border border-input bg-card p-4 text-left text-sm font-bold text-primary">Sarakstīties ar virtuālo asistentu</button>' +
      '<button type="button" data-specialist class="rounded-lg border border-input bg-card p-4 text-left text-sm font-bold text-primary">Rakstīt VID speciālistam</button>' +
      (next === "customs" ? '<button type="button" data-points class="rounded-md border border-primary px-4 py-2 text-sm text-primary sm:col-span-2">Muitas kontroles punkti</button>' : "") +
      "</div>";
    box.querySelector("[data-back]").addEventListener("click", function () { box.remove(); });
    box.querySelector("[data-close]").addEventListener("click", function () { box.remove(); });
    box.querySelector("[data-assistant]").addEventListener("click", function () {
      box.remove();
      openChat(domain);
    });
    box.querySelector("[data-specialist]").addEventListener("click", function () {
      box.remove();
      if (edsFile()) showAuth();
      else location.href = "eds/index.html#pieslegties";
    });
    var points = box.querySelector("[data-points]");
    if (points) points.addEventListener("click", function () {
      box.innerHTML = '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">Muitas kontroles punkti</h2><button type="button" data-back class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button></div><div class="mx-auto max-w-3xl px-4 py-6 text-sm leading-6">Punktu sarakstu un darba laiku skatiet <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/muitas-kontroles-un-robezkontroles-punkti" target="_blank" rel="noopener noreferrer">VID vietnē</a>.</div>';
      box.querySelector("[data-back]").addEventListener("click", function () { showDomain("customs"); });
    });
  }

  function showService() {
    var box = document.getElementById("local-service");
    if (!box) {
      box = document.createElement("section");
      box.id = "local-service";
      box.className = "fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col bg-background";
      document.body.appendChild(box);
    }
    box.hidden = false;
    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">Klientu apkalpošana</h2><button type="button" data-back class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button></div>' +
      '<div class="mx-auto max-w-3xl px-4 py-6 text-sm leading-6"><p>VID Klientu apkalpošanas centri strādā darba dienās no 8:30 līdz 16:30. Tālrunis: 67120000.</p><p class="mt-3"><a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/klientu-apkalposana" target="_blank" rel="noopener noreferrer">www.vid.gov.lv/lv/klientu-apkalposana</a></p><button type="button" data-back class="mt-6 rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button></div>';
    box.querySelectorAll("[data-back]").forEach(function (button) {
      button.addEventListener("click", function () { box.remove(); });
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("button, a");
    if (!button || button.closest("#local-domain, #local-service, #local-auth")) return;
    var text = button.innerText.replace(/\s+/g, " ");
    if (text.includes("Klientu apkalpošana") && button.getAttribute("target") !== "_blank") {
      event.preventDefault();
      showService();
      return;
    }
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
    if (text.includes("Sarakstīties ar virtuālo asistentu")) {
      event.preventDefault();
      openChat(domain);
      return;
    }
    if (text.includes("Nodokļu joma")) showDomain("chat");
    else if (text.includes("Muitas joma")) showDomain("customs");
    else if (text.includes("Azartspēļu un izložu joma")) showDomain("gambling");
  });
})();
