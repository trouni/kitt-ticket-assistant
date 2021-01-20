const refreshRate = 1_000;
const notificationRate = 30_000;
const beep = new Audio(chrome.runtime.getURL("/assets/notification.mp3"));
let ongoingTickets = true;

const getVoices = (_) => {
  return new Promise(function (resolve, reject) {
    let synth = window.speechSynthesis;

    let id = setInterval(() => {
      if (synth.getVoices().length !== 0) {
        resolve(synth.getVoices());
        clearInterval(id);
      }
    }, 10);
  });
};

const initSpeech = (message) => {
  let utterance = new SpeechSynthesisUtterance(message);
  getVoices().then((voices) => {
    utterance.voice = voices.find((el) => el.voiceURI === "Google US English");
  });
  utterance.volume = 0.3;
  utterance.rate = 0.9;
  return utterance;
};

const initToggle = (_) => {
  const assistantToggle = document.createElement("span");

  const toggleCheckbox = document.createElement("input");
  toggleCheckbox.id = "kitt-assistant-checkbox";
  toggleCheckbox.type = "checkbox";
  toggleCheckbox.hidden = true;

  const toggleLabel = document.createElement("label");
  toggleLabel.htmlFor = toggleCheckbox.id;
  let disabledTooltip = "Ticket assistant is disabled. Click to enable";
  let enabledTooltip =
    "The ticket assistant will notify you when you have a ticket. Click to disable";
  toggleLabel.dataset.originalTitle = disabledTooltip;
  toggleLabel.dataset.toggle = "tooltip";

  toggleCheckbox.onchange = (_) => {
    if (toggleCheckbox.checked) {
      toggleLabel.dataset.originalTitle = enabledTooltip;
      window.assistant = startAssistant();
    } else {
      toggleLabel.dataset.originalTitle = disabledTooltip;
      clearInterval(window.assistant);
    }
  };

  assistantToggle.insertAdjacentElement("beforeend", toggleCheckbox);
  assistantToggle.insertAdjacentElement("beforeend", toggleLabel);

  document
    .querySelector('[data-target="navbar-menu.content"] > ul > li:first-child')
    .insertAdjacentElement("afterbegin", assistantToggle);
};

document.addEventListener("DOMContentLoaded", initToggle);

const displayModal = (message) => {
  const assistantWrapper = document.createElement("div");
  assistantWrapper.id = "kitt-assistant-modal";

  const heading = document.createElement("h3");
  heading.innerText = message;
  assistantWrapper.insertAdjacentElement("beforeend", heading);
  assistantWrapper.onclick = removeModal;

  document.body.insertAdjacentElement("beforeend", assistantWrapper);
};

const removeModal = (_) => {
  const assistantWrapper = document.getElementById("kitt-assistant-modal");
  if (assistantWrapper) {
    clearInterval(window.kittNotification);
    window.speechSynthesis.cancel();
    assistantWrapper.remove();
  }
};

const notify = (message) => {
  beep.play();
  let synthSpeech = initSpeech(message);
  window.kittNotification = setInterval((_) => {
    speechSynthesis.speak(synthSpeech);
  }, notificationRate);
};

const startAssistant = (_) => {
  return setInterval((_) => {
    var ticketDiv = document.querySelector(".ticket.is-mine");
    if (ticketDiv) {
      if (!ongoingTickets) {
        var studentName = ticketDiv.querySelector(".ticket .name").innerText;
        var ticketNumber = ticketDiv
          .querySelector(".ordinal-table .ordinal")
          .innerText.toLowerCase();
        var message = `You've been assigned ${studentName}'s ${ticketNumber}.`;
        notify(message);
        displayModal(message);
        ongoingTickets = true;
      }
    } else {
      removeModal();
      ongoingTickets = false;
    }
  }, refreshRate);
};
