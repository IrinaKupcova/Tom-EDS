(function () {
  if (location.protocol !== "file:") return;
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".fixed.bottom-5").forEach(function (node) {
      node.remove();
    });
    if (location.hash === "#pieslegties") showAuth();
    if (edsFile()) clarifyMailbox();
    hideHomeButton();
    showStartChoice();
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

  var specialistOffer = "Diemžēl nevaru atbildēt uz šo jautājumu. Piedāvāju sazināties ar speciālistu. Ja vēlaties, varu pārsūtīt jautājumu VID speciālistam. Vai varat zvanīt uz telefona numuru 67120000, vai sazināties citādā veidā: sadaļa Kontakti.";

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
      return remember(text, specialistOffer, true);
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
    if (/darba laik|klientu apkalp/.test(t)) {
      return remember(text, "VID Klientu apkalpošanas centri strādā darba dienās 8:30–16:30. Konsultatīvais tālrunis: 67120000.", false);
    }
    if (channel === "customs" || /muit|sūtījum|paka/.test(t)) {
      return remember(text, "Par pasta sūtījumiem un muitu atbildi var saņemt uzreiz. Kur palasīt: https://www.vid.gov.lv/lv/muitas-kontroles-un-robezkontroles-punkti .", false);
    }
    if (channel === "gambling" || /azart|izlož|izloz|licenc|atļauj/.test(t)) {
      return remember(text, "Par azartspēlēm un izlozēm aktuālo kārtību skatiet https://www.vid.gov.lv/lv .", false);
    }
    return remember(text, specialistOffer, true);
  }

  var topics = {
    chat: ["Kad atmaksās manu nodokļu pārmaksu?", "Klientu apkalpošanas darba laiks", "Vai jāmaksā muita par paku?"],
    customs: ["Pasta sūtījumi", "Vai jāmaksā muita par paku?"],
    gambling: ["Azartspēļu organizēšana", "Izložu atļauja"],
  };

  function portraitSrc() {
    return (edsFile() ? "../assets/" : "assets/") + "toms-portrait-DBpNN-UY.png";
  }

  function openChat(next) {
    channel = next;
    dialogue = ["Toms: " + greetings[next]];
    if (!panel) panel = buildChat();
    panel.hidden = false;
    panel.querySelector("[data-title]").textContent = next === "chat" ? "Toms" : "Virtuālais asistents";
    panel.querySelector("[data-subtitle]").textContent = next === "customs" ? "VID virtuālais asistents · muita" : next === "gambling" ? "VID virtuālais asistents · azartspēles" : "VID virtuālais asistents";
    renderGreeting(panel.querySelector("[data-log]"), next);
  }

  function renderGreeting(log, next) {
    log.textContent = "";
    var row = document.createElement("div");
    row.className = "flex items-start gap-2";
    row.innerHTML = '<img alt="" class="local-chat-mini" src="' + portraitSrc() + '">';
    var bubble = document.createElement("div");
    bubble.className = "bubble-toms whitespace-pre-wrap";
    bubble.textContent = greetings[next];
    row.appendChild(bubble);
    log.appendChild(row);
    var chips = document.createElement("div");
    chips.className = "ml-8 mt-3 flex flex-wrap gap-1.5";
    chips.setAttribute("data-topics", "");
    topics[next].forEach(function (label) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "rounded-full border border-chat-primary bg-card px-3 py-1.5 text-left text-xs text-chat-primary";
      button.textContent = label;
      button.addEventListener("click", function () { sendText(label); });
      chips.appendChild(button);
    });
    log.appendChild(chips);
  }

  function appendSpecialistOffer(bubble) {
    bubble.appendChild(document.createTextNode("Diemžēl nevaru atbildēt uz šo jautājumu. Piedāvāju sazināties ar speciālistu. Ja vēlaties, varu pārsūtīt jautājumu VID speciālistam. Vai varat zvanīt uz telefona numuru "));
    var phone = document.createElement("a");
    phone.href = "tel:+37167120000";
    phone.className = "font-bold underline";
    phone.textContent = "67120000";
    bubble.appendChild(phone);
    bubble.appendChild(document.createTextNode(", vai sazināties citādā veidā: sadaļa "));
    var contacts = document.createElement("a");
    contacts.href = "#kontakti";
    contacts.className = "font-bold underline";
    contacts.textContent = "Kontakti";
    contacts.addEventListener("click", function (event) {
      if (panel) panel.hidden = true;
      var target = document.getElementById("kontakti");
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView();
    });
    bubble.appendChild(contacts);
    bubble.appendChild(document.createTextNode("."));
  }

  function sendText(text) {
    if (!panel || !text) return;
    var log = panel.querySelector("[data-log]");
    var topicsRow = log.querySelector("[data-topics]");
    if (topicsRow) topicsRow.remove();
    var result = answer(text);
    var user = document.createElement("div");
    user.className = "mt-4 flex justify-end";
    var userBubble = document.createElement("div");
    userBubble.className = "bubble-user whitespace-pre-wrap";
    userBubble.textContent = text;
    user.appendChild(userBubble);
    var reply = document.createElement("div");
    reply.className = "mt-4 flex items-start gap-2";
    reply.innerHTML = '<img alt="" class="local-chat-mini" src="' + portraitSrc() + '">';
    var replyBubble = document.createElement("div");
    replyBubble.className = "bubble-toms whitespace-pre-wrap";
    if (result.handoff) appendSpecialistOffer(replyBubble);
    else replyBubble.textContent = result.reply;
    if (result.handoff) {
      var yes = document.createElement("button");
      yes.type = "button";
      yes.className = "mt-3 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground";
      yes.textContent = "Jā, pārsūtīt VID speciālistam";
      yes.addEventListener("click", acceptHandoff);
      replyBubble.appendChild(yes);
    }
    reply.appendChild(replyBubble);
    log.appendChild(user);
    log.appendChild(reply);
    log.scrollTop = log.scrollHeight;
  }

  function buildChat() {
    var el = document.createElement("section");
    el.className = "fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col overflow-hidden bg-secondary";
    el.innerHTML =
      '<style>.local-chat-wrap{display:flex;min-height:0;flex:1;justify-content:center;overflow:auto;padding:32px 16px}.local-chat-card{display:flex;width:min(440px,100%);height:min(640px,100%);flex-direction:column;overflow:hidden;border:1px solid var(--border);border-radius:12px;background:var(--card);box-shadow:0 8px 24px oklch(0.2 0.04 260 / 0.16)}.local-chat-avatar{width:36px;height:36px;border-radius:999px;object-fit:cover}.local-chat-mini{width:24px;height:24px;border-radius:999px;object-fit:cover}</style>' +
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">Sarakste</h2><div class="flex gap-2"><button type="button" data-back class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div></div>' +
      '<div class="local-chat-wrap"><section class="local-chat-card">' +
      '<div class="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground"><img alt="" class="local-chat-avatar" src="' + portraitSrc() + '"><div><h3 data-title class="text-sm font-bold">Toms</h3><p data-subtitle class="text-xs">VID virtuālais asistents</p></div></div>' +
      '<div data-log class="min-h-0 flex-1 overflow-y-auto bg-chat-surface p-4 text-sm"></div>' +
      '<form class="flex gap-2 border-t border-border bg-card p-3"><input data-input class="input-vid min-w-0 flex-1" aria-label="Jautājums" placeholder="Rakstiet šeit…"><button type="submit" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Sūtīt</button></form></section></div>';
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
      sendText(text);
      input.value = "";
    });
    return el;
  }

  function rememberView(view) {
    try { sessionStorage.setItem("vid-start-view-v1", view); } catch (error) { /* Sākuma skats paliek šai atvēršanai. */ }
  }

  var historyReturn = null;

  function hideHomeButton() {
    var bar = document.querySelector(".view-switch");
    if (!bar) return;
    Array.prototype.forEach.call(bar.querySelectorAll("button"), function (button) {
      if (button.textContent.replace(/\s+/g, " ").trim() === "Sākums") button.remove();
    });
  }

  function showStartChoice() {
    if (location.hash === "#skats") {
      rememberView(edsFile() ? "eds" : "vid");
      history.replaceState(null, "", location.pathname + location.search);
      return;
    }
    try {
      if (sessionStorage.getItem("vid-start-view-v1")) return;
    } catch (error) { /* Rāda sākuma skatu. */ }
    if (document.getElementById("local-start")) return;
    var onEds = edsFile();
    var gate = document.createElement("section");
    gate.id = "local-start";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "local-start-title");
    gate.style.cssText = "position:fixed;inset:0;z-index:100;display:grid;place-items:center;overflow:auto;background:var(--secondary);padding:32px 20px;";
    gate.innerHTML = '<div style="width:100%;max-width:560px;border:1px solid var(--border);border-radius:8px;background:var(--card);padding:32px;"><h1 id="local-start-title" style="text-align:center;font-size:20px;font-weight:700;color:var(--primary);">Sākuma skats</h1><p style="margin-top:8px;text-align:center;font-size:14px;">Izvēlies, kuru VID vidi vēlies apskatīt šajā prototipā.</p><div style="display:grid;gap:12px;margin-top:24px;"><button type="button" data-eds style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--card);text-align:left;font-weight:700;color:var(--primary);">EDS<span style="display:block;margin-top:4px;font-size:12px;font-weight:400;">Elektroniskā deklarēšanas sistēma — ar pieslēgšanos</span></button><button type="button" data-vid style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--card);text-align:left;font-weight:700;color:var(--primary);">VID tīmekļa vietne<span style="display:block;margin-top:4px;font-size:12px;font-weight:400;">www.vid.gov.lv — saziņa bez pieslēgšanās</span></button></div></div>';
    document.body.appendChild(gate);
    gate.querySelector("[data-eds]").addEventListener("click", function () {
      rememberView("eds");
      if (onEds) { gate.remove(); return; }
      location.href = "eds/index.html#skats";
    });
    gate.querySelector("[data-vid]").addEventListener("click", function () {
      rememberView("vid");
      if (!onEds) { gate.remove(); return; }
      location.href = "../index.html#skats";
    });
  }

  function clarifyMailbox() {
    var nav = document.querySelector('[aria-label="Sarakstes sadaļas"]');
    if (nav) nav.hidden = true;
    var style = document.createElement("style");
    style.textContent = ".eds-mail,.eds-mail-active{height:auto;min-height:36px;margin:0 8px 8px 0;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--foreground);font-size:14px;font-weight:700;line-height:1.3;text-align:left}.eds-mail-active{border-color:var(--primary);background:var(--secondary);color:var(--primary)}#local-history{padding:16px 22px 32px}#local-history h2{margin-bottom:8px;font-size:16px;font-weight:700;color:var(--primary)}#local-history article{padding:12px 0;border-bottom:1px solid var(--border)}";
    document.head.appendChild(style);
    Array.prototype.forEach.call(document.querySelectorAll("button"), function (button) {
      if (button.closest("#local-history, #local-domain, #local-auth, #local-service")) return;
      if (button.textContent.replace(/\s+/g, " ").trim() !== "Sarakstes vēsture") return;
      button.style.cssText = "display:flex;flex-direction:column;align-items:flex-start;width:100%;max-width:720px;height:auto;margin-top:12px;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--card);text-align:left;font-size:14px;font-weight:700;color:var(--primary);white-space:normal;";
      var hint = document.createElement("span");
      hint.style.cssText = "display:block;margin-top:4px;font-size:12px;font-weight:400;line-height:1.4;color:var(--muted-foreground);";
      hint.textContent = "Šeit ir nelasītās, saņemtās, nosūtītās un sagatavotās ziņas, kā arī sarunas ar asistentu.";
      button.appendChild(hint);
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        showLocalHistory("all");
      });
    });
  }

  function historyDate(value) {
    var time = Date.parse(value);
    if (!value || Number.isNaN(time)) return "Datums nav saglabāts";
    return new Date(time).toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Riga" });
  }

  function canCancelHistory(value) {
    var time = Date.parse(value);
    if (!value || Number.isNaN(time)) return false;
    return Date.now() - time < 24 * 60 * 60 * 1000;
  }

  function saveHistoryCancel(kind, id, reason, note) {
    var stored = { conversations: [], outbox: [] };
    try { stored = JSON.parse(sessionStorage.getItem("vid-eds-correspondence-v1") || "{}"); } catch (error) { stored = { conversations: [], outbox: [] }; }
    var list = kind === "chat" ? stored.conversations : stored.outbox;
    (Array.isArray(list) ? list : []).forEach(function (row) {
      if (row && row.id === id) {
        row.cancelled = true;
        row.cancelReason = reason;
        row.cancelNote = note;
      }
    });
    sessionStorage.setItem("vid-eds-correspondence-v1", JSON.stringify(stored));
  }

  function appendHistoryDate(article, value) {
    var date = document.createElement("p");
    date.className = "text-sm font-bold";
    date.textContent = historyDate(value);
    article.appendChild(date);
  }

  function appendCancelControl(article, row, kind, filter) {
    if (row && row.cancelled) {
      var done = document.createElement("p");
      done.className = "mt-2 text-sm font-bold text-primary";
      done.textContent = "Ziņojums atcelts" + (row.cancelReason ? " · " + row.cancelReason : "") + (row.cancelNote ? " — " + row.cancelNote : "");
      article.appendChild(done);
      return;
    }
    if (!canCancelHistory(row && row.date)) {
      var closed = document.createElement("p");
      closed.className = "mt-2 text-xs";
      closed.textContent = "Ziņojumu var atcelt 1 dienas laikā.";
      article.appendChild(closed);
      return;
    }
    var button = document.createElement("button");
    button.type = "button";
    button.className = "mt-3 rounded-md border border-primary px-3 py-2 text-sm text-primary";
    button.textContent = "Atcelt ziņojumu";
    button.addEventListener("click", function () {
      button.remove();
      var form = document.createElement("form");
      form.className = "mt-3";
      form.innerHTML = '<label class="mb-2 block text-sm text-primary">Iemesls<select class="input-vid mt-1 h-9 w-full" data-reason><option>Jau atrisināju</option><option>Kļūdaini iesniegts</option><option>Cits iemesls</option></select></label><label class="mb-2 block text-sm text-primary">Paskaidrojums<textarea class="input-vid mt-1 h-20 w-full" data-note placeholder="Varat papildināt iemeslu"></textarea></label><div class="flex gap-2"><button type="submit" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Apstiprināt atcelšanu</button><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div>';
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var reason = form.querySelector("[data-reason]").value;
        var note = form.querySelector("[data-note]").value.trim();
        if (reason === "Cits iemesls" && !note) return;
        saveHistoryCancel(kind, row.id, reason, note);
        showLocalHistory(filter);
      });
      form.querySelector("[data-close]").addEventListener("click", function () { showLocalHistory(filter); });
      article.appendChild(form);
    });
    article.appendChild(button);
  }

  function showLocalHistory(filter) {
    var main = document.querySelector("main");
    if (!historyReturn) historyReturn = { scroll: window.scrollY, mainHidden: main ? main.hidden : false };
    if (main) main.hidden = true;
    var box = document.getElementById("local-history");
    if (!box) {
      box = document.createElement("section");
      box.id = "local-history";
      if (main && main.parentNode) main.parentNode.insertBefore(box, main);
      else document.body.appendChild(box);
    }
    box.hidden = false;
    box.textContent = "";
    var back = document.createElement("button");
    back.type = "button";
    back.textContent = "Atpakaļ";
    back.style.cssText = "margin-bottom:16px;border:1px solid var(--primary);border-radius:6px;background:var(--card);padding:8px 12px;font-size:14px;font-weight:700;color:var(--primary);";
    back.addEventListener("click", function () {
      box.hidden = true;
      if (main) main.hidden = historyReturn ? historyReturn.mainHidden : false;
      var top = historyReturn ? historyReturn.scroll : 0;
      historyReturn = null;
      window.scrollTo(0, top);
    });
    var title = document.createElement("h2");
    title.textContent = "Sarakstes vēsture";
    var intro = document.createElement("p");
    intro.className = "mb-4 text-sm leading-6";
    intro.textContent = "Šeit ir nelasītās, saņemtās, nosūtītās un sagatavotās ziņas, kā arī sarunas ar asistentu. Tās glabājas 30 dienas.";
    var filters = document.createElement("div");
    filters.className = "mb-4";
    [["all", "Visas"], ["unread", "Nelasītās ziņas"], ["inbox", "Saņemtās ziņas"], ["sent", "Nosūtītās ziņas"], ["drafts", "Sagatavotās ziņas"], ["chats", "Sarunas ar asistentu"]].forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = item[0] === filter ? "eds-mail-active" : "eds-mail";
      button.textContent = item[1];
      button.addEventListener("click", function () { showLocalHistory(item[0]); });
      filters.appendChild(button);
    });
    box.appendChild(back);
    box.appendChild(title);
    box.appendChild(intro);
    box.appendChild(filters);
    seedDemoHistory();
    var stored = { conversations: [], outbox: [] };
    try { stored = JSON.parse(sessionStorage.getItem("vid-eds-correspondence-v1") || "{}"); } catch (error) { stored = { conversations: [], outbox: [] }; }
    var chats = Array.isArray(stored.conversations) ? stored.conversations : [];
    var sent = Array.isArray(stored.outbox) ? stored.outbox : [];
    var notes = { unread: "Ziņas, kuras vēl neesat atvēruši. Šeit vēl nav nelasītu ziņu.", inbox: "Ziņas, ko VID jums ir nosūtījis. Šeit vēl nav saņemtu ziņu.", drafts: "Ziņas, ko sagatavojāt, bet vēl nenosūtījāt. Šeit vēl nav sagatavotu ziņu." };
    if (notes[filter] || (filter === "chats" && !chats.length) || (filter === "sent" && !sent.length) || (filter === "all" && !chats.length && !sent.length)) {
      var empty = document.createElement("p");
      empty.className = "text-sm";
      empty.textContent = notes[filter] || (filter === "chats" ? "Šeit vēl nav sarunu ar asistentu." : filter === "sent" ? "Šeit vēl nav nosūtītu ziņu." : "Šeit vēl nav sarunu vai nosūtītu ziņu.");
      if (notes[filter] || filter === "chats" || filter === "sent" || filter === "all") box.appendChild(empty);
      if (notes[filter] || ((filter === "chats" || filter === "all") && !chats.length) && ((filter === "sent" || filter === "all") && !sent.length)) return;
    }
    if (filter === "all" || filter === "chats") chats.forEach(function (row) {
      var article = document.createElement("article");
      appendHistoryDate(article, row && row.date);
      var heading = document.createElement("h3");
      heading.className = "text-sm font-bold text-primary";
      var first = row && Array.isArray(row.messages) ? row.messages.filter(function (message) { return message.from === "user"; })[0] : null;
      heading.textContent = first && first.text ? first.text : "Saruna ar asistentu";
      if (row && row.demo) {
        var badge = document.createElement("p");
        badge.className = "text-xs font-bold text-primary";
        badge.textContent = "Demonstrācijas paraugs";
        article.appendChild(badge);
      }
      var note = document.createElement("p");
      note.className = "mt-1 text-xs";
      note.textContent = "Saruna ar virtuālo asistentu";
      article.appendChild(heading);
      article.appendChild(note);
      if (row && Array.isArray(row.messages)) row.messages.forEach(function (message) {
        if (!message || message.from === "system") return;
        var line = document.createElement("p");
        line.className = "mt-2 text-sm";
        line.textContent = (message.from === "user" ? "Jūs: " : "Toms: ") + message.text;
        article.appendChild(line);
      });
      appendCancelControl(article, row, "chat", filter);
      box.appendChild(article);
    });
    if (filter === "all" || filter === "sent") sent.forEach(function (item) {
      var article = document.createElement("article");
      appendHistoryDate(article, item && item.date);
      var heading = document.createElement("h3");
      heading.className = "text-sm font-bold text-primary";
      heading.textContent = item && item.tema ? item.tema : "Nosūtīta ziņa";
      if (item && item.demo) {
        var badge = document.createElement("p");
        badge.className = "text-xs font-bold text-primary";
        badge.textContent = "Demonstrācijas paraugs";
        article.appendChild(badge);
      }
      article.appendChild(heading);
      if (item && item.origin === "assistant") {
        var note = document.createElement("p");
        note.className = "mt-1 text-sm";
        note.style.fontWeight = "700";
        note.style.color = "var(--primary)";
        note.textContent = "Speciālistam vēstuli nosūtīja čatbots";
        article.appendChild(note);
      }
      if (item && (item.struktura || item.cancelled)) {
        var meta = document.createElement("p");
        meta.className = "mt-1 text-xs";
        meta.textContent = [item.struktura, item.cancelled ? "Ziņojums atcelts" : ""].filter(Boolean).join(" · ");
        article.appendChild(meta);
      }
      if (item && item.teksts) {
        var body = document.createElement("p");
        body.className = "mt-2 text-sm";
        body.style.whiteSpace = "pre-wrap";
        body.textContent = item.teksts;
        article.appendChild(body);
      }
      appendCancelControl(article, item, "letter", filter);
      box.appendChild(article);
    });
  }

  function saveSentLetter(letter) {
    var stored = { conversations: [], outbox: [] };
    try { stored = JSON.parse(sessionStorage.getItem("vid-eds-correspondence-v1") || "{}"); } catch (error) { stored = { conversations: [], outbox: [] }; }
    if (!stored || typeof stored !== "object") stored = { conversations: [], outbox: [] };
    var outbox = Array.isArray(stored.outbox) ? stored.outbox : [];
    outbox.unshift(letter);
    stored.outbox = outbox;
    if (!Array.isArray(stored.conversations)) stored.conversations = [];
    try { sessionStorage.setItem("vid-eds-correspondence-v1", JSON.stringify(stored)); } catch (error) { /* Vēstule paliek redzama šajā lapā. */ }
  }

  function seedDemoHistory() {
    if (sessionStorage.getItem("vid-eds-demo-seeded-v1")) return;
    var ago = function (hours) { return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(); };
    var dispute = [
      { from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" },
      { from: "user", text: "Nepiekrītu nodokļu aprēķinam un gribu to pārsūdzēt." },
      { from: "toms", text: "Diemžēl nevaru atbildēt uz šo jautājumu. Piedāvāju sazināties ar speciālistu. Ja vēlaties, varu pārsūtīt jautājumu VID speciālistam." },
      { from: "user", text: "Jā, pārsūtīt VID speciālistam." },
      { from: "toms", text: "Paldies, jautājumu pārsūtīju speciālistam." }
    ];
    var customs = [
      { from: "toms", text: "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu." },
      { from: "user", text: "Muitas lēmumā prece ir klasificēta nepareizi. Lūdzu izvērtēt." },
      { from: "toms", text: "Diemžēl nevaru atbildēt uz šo jautājumu. Piedāvāju sazināties ar speciālistu. Ja vēlaties, varu pārsūtīt jautājumu VID speciālistam." },
      { from: "user", text: "Jā, pārsūtiet visu saraksti." },
      { from: "toms", text: "Paldies, jautājumu pārsūtīju speciālistam." }
    ];
    var textOf = function (messages) { return messages.map(function (message) { return (message.from === "user" ? "Klients: " : "Toms: ") + message.text; }).join("\n\n"); };
    var existing = { conversations: [], outbox: [] };
    try { existing = JSON.parse(sessionStorage.getItem("vid-eds-correspondence-v1") || "{}"); } catch (error) { existing = { conversations: [], outbox: [] }; }
    var conversations = [
      { id: "demo-chat-dispute", category: "chat", messages: dispute, date: ago(2), demo: true },
      { id: "demo-chat-customs", category: "customs", messages: customs, date: ago(24 * 12), demo: true },
      { id: "demo-chat-refund", category: "chat", messages: [{ from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" }, { from: "user", text: "Kad atmaksā nodokļu pārmaksu pēc gada deklarācijas?" }, { from: "toms", text: "Pēc gada ienākumu deklarācijas pārmaksu parasti atmaksā trīs mēnešu laikā. Statusu skatiet EDS. Šī ir vispārīga atbilde, nevis jūsu personas dati." }], date: ago(24 * 3), demo: true },
      { id: "demo-chat-hours", category: "chat", messages: [{ from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" }, { from: "user", text: "Kāds ir klientu apkalpošanas darba laiks?" }, { from: "toms", text: "VID Klientu apkalpošanas centri strādā darba dienās 8:30–16:30. Konsultatīvais tālrunis: 67120000." }], date: ago(24 * 5), demo: true }
    ];
    var outbox = [
      { id: "demo-letter-recent", kategorija: "Nodokļu jautājumi", tema: "Lēmuma, aprēķina vai soda apstrīdēšana", struktura: "VID speciālists", teksts: textOf(dispute), date: ago(2), origin: "assistant", demo: true },
      { id: "demo-letter-customs", kategorija: "Muitas jautājumi", tema: "Muitas lēmuma vai preču klasifikācijas strīds", struktura: "Muitas pārvalde", teksts: textOf(customs), date: ago(24 * 12), origin: "assistant", demo: true },
      { id: "demo-letter-client-eds", kategorija: "Dokumenta iesniegšana", tema: "Jautājums — Jautājums par EDS lietošanu", struktura: "VID speciālists", teksts: "Nevaru atrast, kur EDS iesniegt gada ienākumu deklarāciju. Lūdzu, paskaidrojiet soļus.", date: ago(24 * 6), origin: "client", demo: true },
      { id: "demo-letter-client-service", kategorija: "Dokumenta iesniegšana", tema: "Sūdzība — Sūdzība par klientu apkalpošanu", struktura: "VID speciālists", teksts: "Konsultācijā pa tālruni nesaņēmu atbildi par deklarācijas termiņu. Lūdzu saziņu no speciālista.", date: ago(24 * 15), origin: "client", demo: true }
    ];
    var knownChats = {};
    var knownLetters = {};
    (Array.isArray(existing.conversations) ? existing.conversations : []).forEach(function (item) { if (item && item.id) knownChats[item.id] = true; });
    (Array.isArray(existing.outbox) ? existing.outbox : []).forEach(function (item) { if (item && item.id) knownLetters[item.id] = true; });
    sessionStorage.setItem("vid-eds-correspondence-v1", JSON.stringify({
      conversations: conversations.filter(function (item) { return !knownChats[item.id]; }).concat(Array.isArray(existing.conversations) ? existing.conversations : []),
      outbox: outbox.filter(function (item) { return !knownLetters[item.id]; }).concat(Array.isArray(existing.outbox) ? existing.outbox : [])
    }));
    sessionStorage.setItem("vid-eds-demo-seeded-v1", "1");
  }

  function edsFile() {
    return /[\\/]eds[\\/]index\.html$/i.test(location.pathname);
  }

  var pendingPoint = "";
  var customsGroups = [
    { region: "Rīga", points: ["Lidostas muitas kontroles punkts", "Rīgas brīvostas muitas kontroles punkts", "Importa muitas kontroles punkts", "Šķirotavas muitas kontroles punkts"] },
    { region: "Kurzeme", points: ["Liepājas ostas muitas kontroles punkts", "Ventspils ostas muitas kontroles punkts"] },
    { region: "Latgale", points: ["Terehovas muitas kontroles punkts", "Grebņevas muitas kontroles punkts", "Pāternieku muitas kontroles punkts", "Rēzeknes II muitas kontroles punkts", "Daugavpils preču stacijas muitas kontroles punkts", "Zilupes muitas kontroles punkts", "Kārsavas muitas kontroles punkts", "Indras muitas kontroles punkts"] },
    { region: "Zemgale un Vidzeme", points: ["Jelgavas muitas kontroles punkts", "Valmieras muitas kontroles punkts"] }
  ];

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
      '<p class="mb-5 text-sm leading-6">' + (pendingPoint ? "Pēc pieslēgšanās varēsiet rakstīt: " + pendingPoint + "." : "Pēc pieslēgšanās varēsiet rakstīt VID speciālistam.") + "</p>" +
      '<button type="button" data-login class="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Pieslēgties EDS</button>' +
      '<p class="mt-3 text-center text-[10px] text-muted-foreground">Pieslēgšanās šajā prototipā tiek demonstrēta.</p></div>';
    box.querySelector("[data-close]").addEventListener("click", function () {
      pendingPoint = "";
      box.remove();
    });
    box.querySelector("[data-login]").addEventListener("click", showForm);
  }

  function showForm() {
    var box = document.getElementById("local-auth");
    if (!box) return;
    var recipient = pendingPoint;
    pendingPoint = "";
    var themes = {
      "Jautājums": ["Jautājums par deklarācijas iesniegšanu", "Jautājums par nodokļa aprēķinu", "Jautājums par maksājumu", "Jautājums par EDS lietošanu", "Jautājums par termiņu", "Cits jautājums"],
      "Paskaidrojums": ["Paskaidrojums par darījuma būtību", "Paskaidrojums par PVN darījumiem", "Cits paskaidrojums"],
      "Sūdzība": ["Sūdzība par VID pieņemtu lēmumu", "Sūdzība par VID darbinieka rīcību", "Sūdzība par klientu apkalpošanu", "Sūdzība par EDS darbību", "Cita sūdzība"],
      "Ierosinājums": ["Ierosinājums VID pakalpojuma uzlabošanai", "Ierosinājums par EDS", "Ierosinājums par klientu apkalpošanu", "Cits ierosinājums"],
      "Muitas jautājums": ["Par importa PVN un muitas nodokli", "Cits muitas jautājums"],
      "Azartspēļu un izložu jautājums": ["Par interaktīvo azartspēļu organizēšanu", "Par azartspēļu automātiem", "Cits azartspēļu vai izložu jautājums"]
    };
    var themeOptions = Object.keys(themes).map(function (name) { return "<option>" + name + "</option>"; }).join("");
    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">' + (recipient ? "Rakstīt: " + recipient : "Iesniegt dokumentu vai rakstīt speciālistam") + '</h2><button type="button" data-close class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Aizvērt</button></div>' +
      '<form class="mx-auto w-full max-w-3xl px-4 py-6">' +
      '<p role="note" class="mb-4 rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-6"><strong>Paziņojums.</strong> Daudzas strukturētās veidlapas iesniedzamajiem dokumentiem ir kreisajā pusē sadaļā DOKUMENTI.</p>' +
      (recipient ? '<p class="mb-4 text-sm leading-6">Adresāts: ' + recipient + ".</p>" : "") +
      '<label class="mb-3 block text-sm text-primary">Tēma<select required data-tema class="input-vid mt-1 h-9 w-full"><option value="">— izvēlieties —</option>' + themeOptions + '</select></label>' +
      '<label class="mb-3 block text-sm text-primary">Apakštēma<select required data-apakstema class="input-vid mt-1 h-9 w-full" disabled><option value="">— vispirms izvēlieties tēmu —</option></select></label>' +
      '<label class="mb-4 block text-sm text-primary">Teksts<textarea required data-teksts class="input-vid mt-1 h-28 w-full" placeholder="Aprakstiet savu jautājumu vai sniedziet paskaidrojumu"></textarea></label>' +
      '<label class="mb-1 block text-sm text-primary">Pielikums<input data-pielikums class="mt-1 block w-full text-xs" type="file" multiple></label>' +
      '<p class="mb-4 text-xs text-muted-foreground">Atļautie formāti: ODT, ODS, DOCX, XLSX, PDF, JPG, JPEG, TIF, TIFF, PNG, EDOC, ASICE, HEIC, XHTML, ZIP. Viens fails līdz 20 MB, kopā līdz 50 MB.</p>' +
      '<div class="flex gap-3"><button type="submit" class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Nosūtīt</button><button type="button" data-close class="rounded-md border border-primary px-4 py-2 text-sm text-primary">Aizvērt</button></div>' +
      "</form>";
    var draft = "";
    try { draft = JSON.parse(sessionStorage.getItem("vid-eds-specialist-draft") || "null"); } catch (error) { draft = ""; }
    var themeSelect = box.querySelector("[data-tema]");
    var subtypeSelect = box.querySelector("[data-apakstema]");
    themeSelect.addEventListener("change", function () {
      var items = themes[themeSelect.value] || [];
      subtypeSelect.innerHTML = items.length ? '<option value="">— izvēlieties —</option>' + items.map(function (name) { return "<option>" + name + "</option>"; }).join("") : '<option value="">— vispirms izvēlieties tēmu —</option>';
      subtypeSelect.disabled = !items.length;
    });
    if (recipient) {
      themeSelect.value = "Muitas jautājums";
      themeSelect.dispatchEvent(new Event("change"));
    }
    var letterOrigin = "client";
    if (draft && draft.teksts) {
      letterOrigin = "assistant";
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
      var tema = box.querySelector("[data-tema]").value + " — " + box.querySelector("[data-apakstema]").value;
      var teksts = box.querySelector("[data-teksts]").value;
      saveSentLetter({
        id: "letter-" + Date.now(),
        kategorija: "Dokumenta iesniegšana",
        tema: tema,
        struktura: recipient || "VID speciālists",
        teksts: teksts,
        date: new Date().toISOString(),
        origin: letterOrigin,
      });
      box.remove();
      var note = document.createElement("section");
      note.className = "mx-auto mb-4 max-w-3xl border border-border bg-card p-4";
      note.innerHTML =
        '<h2 class="text-lg font-bold text-primary">Paldies, jautājumu pārsūtīju speciālistam.</h2>' +
        '<div class="mt-4 flex flex-wrap gap-3"><div class="min-w-[220px] flex-1 rounded-md border-2 border-primary px-4 py-3"><p class="text-sm font-bold text-primary">Parastais atbildes termiņš</p><p class="mt-1 text-lg font-bold">10 darba dienas</p></div><div class="min-w-[220px] flex-1 rounded-md border-2 border-primary px-4 py-3"><p class="text-sm font-bold text-primary">Atbildes termiņš sarežģītos gadījumos</p><p class="mt-1 text-lg font-bold">1 mēnesis</p></div></div>' +
        (/grāmatiņ|gramatin/i.test(tema) ? '<p class="mt-4 rounded-md border-2 border-primary bg-warning-surface px-4 py-3 text-sm font-semibold leading-6 text-primary">Vēršam uzmanību, ka šo pakalpojumu varat izdarīt paši EDS sadaļā “Algas nodokļa grāmatiņa”.</p>' : "") +
        '<p class="mt-4 rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-6">Ja vēlaties atsaukt savu ziņojumu, varat to izdarīt 1 dienas laikā sadaļā Sarakstes vēsture. Atceļot norādiet iemeslu: jau atrisināju, kļūdaini iesniegts vai cits iemesls.</p>' +
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
      (next === "customs" ? '<button type="button" data-points class="rounded-md border border-primary px-4 py-2 text-sm text-primary sm:col-span-2">Rakstīt uz muitas kontroles punktu</button>' : "") +
      "</div>";
    box.querySelector("[data-back]").addEventListener("click", function () { box.remove(); });
    box.querySelector("[data-close]").addEventListener("click", function () { box.remove(); });
    box.querySelector("[data-assistant]").addEventListener("click", function () {
      box.remove();
      openChat(domain);
    });
    box.querySelector("[data-specialist]").addEventListener("click", function () {
      pendingPoint = "";
      box.remove();
      sessionStorage.removeItem("vid-eds-specialist-draft");
      if (edsFile()) showAuth();
      else location.href = "eds/index.html#pieslegties";
    });
    var points = box.querySelector("[data-points]");
    if (points) points.addEventListener("click", showCustomsPoints);
  }

  function showCustomsPoints() {
    var box = document.getElementById("local-domain");
    if (!box) return;
    var list = customsGroups.map(function (group) {
      return '<section><h3 class="border-b border-border pb-2 text-sm font-bold">' + group.region + "</h3><ul>" + group.points.map(function (point) {
        return '<li class="flex items-center justify-between gap-3 border-b border-border py-2 text-sm"><span>' + point + '</span><button type="button" data-write="' + point + '" class="shrink-0 font-bold text-primary underline">Rakstīt</button></li>';
      }).join("") + "</ul></section>";
    }).join("");
    box.innerHTML =
      '<div class="flex items-center justify-between border-b border-border bg-card px-4 py-3"><h2 class="text-base font-bold text-primary">Rakstīt uz muitas kontroles punktu</h2><button type="button" data-back class="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button></div>' +
      '<div class="mx-auto w-full max-w-3xl px-4 py-6"><p class="mb-4 text-sm leading-6">Izvēlieties punktu no saraksta un rakstiet tam uzreiz.</p><div class="grid gap-5 sm:grid-cols-2">' + list + '</div><p class="mt-4 text-sm leading-6">Kontakti un aktuālais darba laiks: <a class="font-bold text-primary underline" href="https://www.vid.gov.lv/lv/muitas-kontroles-un-robezkontroles-punkti" target="_blank" rel="noopener noreferrer">VID vietne</a>.</p></div>';
    box.querySelector("[data-back]").addEventListener("click", function () { showDomain("customs"); });
    box.querySelectorAll("[data-write]").forEach(function (button) {
      button.addEventListener("click", function () {
        pendingPoint = button.getAttribute("data-write") || "";
        box.remove();
        showAuth();
      });
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
    if (!button || event.composedPath().some(function (node) { return node.id === "local-domain" || node.id === "local-service" || node.id === "local-auth"; })) return;
    var text = button.innerText.replace(/\s+/g, " ");
    if (text.includes("Klientu apkalpošana") && button.getAttribute("target") !== "_blank") {
      event.preventDefault();
      showService();
      return;
    }
    if (/Rakstīt VID speciālistam|Rakstīt speciālistam|Iesniegt dokumentu/.test(text)) {
      event.preventDefault();
      pendingPoint = "";
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
