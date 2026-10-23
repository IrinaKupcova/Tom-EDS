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
  var dialogue = [];
  var complexTopics = [
    ["Lēmuma, aprēķina vai soda apstrīdēšana un pārsūdzība", /apstrīd|pārsūdz|nepiekrīt|pretrun/],
    ["Nokavējuma naudas vai soda naudas atcelšana", /(nokavējuma naud|soda naud).{0,40}(atcel|samazin|dzēst)|(atcel|samazin|dzēst).{0,40}(nokavējuma naud|soda naud)/],
    ["Nodokļu kontroles, audita vai pārbaudes lietas izvērtējums", /nodokļu kontrol|audita|auditu|\baudits\b|tematisk/],
    ["Nodokļu parāda dzēšana", /parāda dzēš|dzēst parād|paradu dzes/],
    ["Transfertcenas, pastāvīgā pārstāvniecība vai nodokļu konvencija", /transfertcen|pastāvīgā pārstāv|nodokļu konvenc|dubultā aplik/],
    ["Muitas lēmuma vai preču klasifikācijas strīds", /muitas lēmum|preču klasifik|taric|izcelsmes strīd|muitas parād/],
    ["Azartspēļu vai izložu licences atteikums, apturēšana vai anulēšana", /licenc\w*.{0,24}(atteik|anul|aptur)|(atteik|anul|aptur).{0,24}licenc/],
  ];

  var greetings = {
    chat: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
    customs: "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu. Par ko vēlaties jautāt?",
    gambling: "Labdien! Palīdzēšu atrast atbildi par azartspēlēm un izlozēm. Par ko vēlaties jautāt?",
  };

  function remember(text, reply, handoff) {
    dialogue.push("Klients: " + text);
    dialogue.push("Toms: " + reply);
    return { reply: reply, handoff: handoff };
  }

  function acceptHandoff() {
    try {
      sessionStorage.setItem("vid-eds-specialist-draft", JSON.stringify({
        kategorija: "Vispārīgi jautājumi",
        tema: "Konsultācija par nodokļu jautājumu",
        struktura: "Konsultāciju pārvalde",
        teksts: dialogue.join("\n\n"),
      }));
    } catch (error) { /* The confirmed letter can still be shown in this page. */ }
    if (edsFile()) showAuth();
    else location.href = "eds/index.html#pieslegties";
  }

  function answer(text) {
    var t = text.toLowerCase();
    var topic = null;
    for (var i = 0; i < complexTopics.length; i += 1) {
      if (complexTopics[i][1].test(t)) topic = complexTopics[i][0];
    }
    if (topic) {
      return remember(text, "Šo tēmu es vērtēju kā sarežģītu: " + topic + ". Zvaniet 67120000 vai nospiediet Jā. Visa sarakste speciālistam aiziet tikai pēc šī apstiprinājuma.", true);
    }
    if (/iesniegt|iesnieg|veidlap|izziņ/.test(t)) {
      return remember(text, "Šo varat izdarīt pats. EDS kreisajā joslā atveriet Dokumenti → Sagatavot dokumentu → No veidlapas. Kur palasīt: https://www.vid.gov.lv/lv un https://eds.vid.gov.lv/login/ .", false);
    }
    if (/grāmatiņ|gramatin/.test(t)) {
      return remember(text, "Šādam pakalpojumam ir veidlapa EDS: “Iesniegums par algas nodokļa grāmatiņas piešķiršanu”. To var atvērt pēc EDS pieslēgšanās, sadaļā Sarakste ar VID.", false);
    }
    if (/parād|pārmaks|mans |manu |deklarācij/.test(t)) {
      return remember(text, "Lai apskatītu jūsu datus, vispirms jāpieslēdzas EDS. Šajā demonstrācijā pēc pieslēgšanās var turpināt jautājumu.", false);
    }
    if (channel === "customs" || /muit|sūtījum|paka/.test(t)) {
      return remember(text, "Par pasta sūtījumiem un muitu atbildi var saņemt uzreiz. Kur palasīt: https://www.vid.gov.lv/lv/muitas-kontroles-un-robezkontroles-punkti .", false);
    }
    if (channel === "gambling" || /azart|izlož|izloz|licenc|atļauj/.test(t)) {
      return remember(text, "Par azartspēlēm un izlozēm aktuālo kārtību skatiet https://www.vid.gov.lv/lv .", false);
    }
    return remember(text, "Uz šo man nav viennozīmīgas atbildes. Zvaniet 67120000 vai nospiediet Jā. Visa sarakste speciālistam aiziet tikai pēc šī apstiprinājuma.", true);
  }

  function openChat(next) {
    channel = next;
    dialogue = ["Toms: " + greetings[next]];
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
      var result = answer(text);
      var block = document.createElement("div");
      block.className = "mt-4 whitespace-pre-wrap";
      block.textContent = "Jūs: " + text + "\n\nToms: " + result.reply;
      if (result.handoff) {
        var yes = document.createElement("button");
        yes.type = "button";
        yes.className = "mt-3 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground";
        yes.textContent = "Jā, pārsūtīt VID speciālistam";
        yes.addEventListener("click", acceptHandoff);
        block.appendChild(yes);
      }
      log.appendChild(block);
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
    var draft = "";
    try { draft = JSON.parse(sessionStorage.getItem("vid-eds-specialist-draft") || "null"); } catch (error) { draft = ""; }
    if (draft && draft.teksts) {
      box.querySelector("[data-teksts]").value = draft.teksts;
      sessionStorage.removeItem("vid-eds-specialist-draft");
    }
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
      sessionStorage.removeItem("vid-eds-specialist-draft");
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
    if (/Rakstīt VID speciālistam|Rakstīt speciālistam|Iesniegt dokumentu/.test(text)) {
      event.preventDefault();
      sessionStorage.removeItem("vid-eds-specialist-draft");
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
