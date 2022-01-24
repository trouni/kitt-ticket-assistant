function TicketAssistant() {
  this.refreshRate = 500;
  this.notificationRate = 30_000;
  this.ongoingTickets = true;
  this.modalShowing = () => !!document.getElementById("kitt-assistant-modal");
  this.onDuty = document.querySelector(".switch-container.is-on-duty") !== null;
  this.beep = new Audio(chrome.runtime.getURL("/assets/notification_1.mp3"));
  this.startingSound = new Audio(
    chrome.runtime.getURL("/assets/notification_2.mp3")
  );
  this.synth = window.speechSynthesis;

  this.initialize = () => {
    var assistantToggle = document.createElement("span");

    this.toggleCheckbox = document.createElement("input");
    this.toggleCheckbox.id = "kitt-assistant-checkbox";
    this.toggleCheckbox.type = "checkbox";
    this.toggleCheckbox.hidden = true;

    this.toggleLabel = document.createElement("label");
    this.toggleLabel.htmlFor = this.toggleCheckbox.id;
    this.disabledTooltip = "Ticket assistant is disabled. Click to enable";
    this.enabledTooltip =
      "The ticket assistant will notify you when you have a ticket. Click to disable";
    this.toggleLabel.dataset.originalTitle = this.disabledTooltip;
    this.toggleLabel.dataset.toggle = "tooltip";

    this.toggleCheckbox.onchange = () => {
      if (this.toggleCheckbox.checked) {
        this.startAssistant();
      } else {
        this.stoptAssistant();
      }
    };

    assistantToggle.insertAdjacentElement("beforeend", this.toggleCheckbox);
    assistantToggle.insertAdjacentElement("beforeend", this.toggleLabel);

    document
      .querySelector(
        '[data-navbar-menu-target="content"] > ul > li:first-child'
      )
      .insertAdjacentElement("afterbegin", assistantToggle);

    this.activationHelper();
  };

  this.activationHelper = () => {
    this.activationHelperInterval = setInterval(() => {
      if (
        !this.onDuty &&
        document.querySelector(".switch-container.is-on-duty")
      ) {
        this.onDuty = true;
        this.displayActivationModal();
      } else if (
        this.onDuty &&
        !document.querySelector(".switch-container.is-on-duty")
      ) {
        this.onDuty = false;
        this.removeModal();
      }
    }, this.refreshRate * 2);
  };

  this.getVoices = () => {
    return new Promise((resolve, reject) => {
      var fetchVoicesInterval = setInterval(() => {
        if (this.synth.getVoices().length !== 0) {
          resolve(this.synth.getVoices());
          clearInterval(fetchVoicesInterval);
        }
      }, 10);
    });
  };

  this.initSpeech = (message) => {
    let utterance = new SpeechSynthesisUtterance(message);
    this.getVoices().then((voices) => {
      utterance.voice = voices.find(
        (el) => el.voiceURI === "Google US English"
      );
    });
    utterance.volume = 0.3;
    utterance.rate = 0.9;
    return utterance;
  };

  this.createModal = (content) => {
    var assistantWrapper = document.createElement("div");
    assistantWrapper.id = "kitt-assistant-modal";

    assistantWrapper.insertAdjacentElement("beforeend", content);
    return assistantWrapper;
  };

  this.displayActivationModal = () => {
    var activationTimeout = 10;
    var content = document.createElement("div");

    var heading = document.createElement("h3");
    heading.innerText = "Would you like to activate the ticket assistant?";
    content.insertAdjacentElement("beforeend", heading);

    var description = document.createElement("p");
    description.innerHTML = `Click anywhere to dismiss.`;
    content.insertAdjacentElement("beforeend", description);

    var button = document.createElement("button");
    button.innerText = "Yes, activate the assistant";
    button.classList = "btn btn-default";
    button.onclick = () => {
      this.toggleCheckbox.checked = true;
      this.startAssistant();
    };
    content.insertAdjacentElement("beforeend", button);

    var description = document.createElement("p");
    description.innerHTML = `This message will automatically disappear in <strong>${activationTimeout}</strong>s...`;
    content.insertAdjacentElement("beforeend", description);

    var modal = this.createModal(content);
    modal.onclick = this.removeModal;

    document.body.insertAdjacentElement("beforeend", modal);

    this.expireModalInterval = setInterval(() => {
      activationTimeout -= 1;
      if (
        document.getElementById("kitt-assistant-modal") &&
        activationTimeout >= 0
      ) {
        document.querySelector("#kitt-assistant-modal p > strong").innerText =
          activationTimeout;
      } else {
        this.removeModal();
        clearInterval(this.expireModalInterval);
      }
    }, 1000);
  };

  this.displayTicketModal = (message, button = null) => {
    var content = document.createElement("div");

    var heading = document.createElement("h3");
    heading.innerText = message;
    content.insertAdjacentElement("beforeend", heading);

    var description = document.createElement("p");
    description.innerText = "Click anywhere to dismiss the ticket assistant";
    content.insertAdjacentElement("beforeend", description);

    if (button) content.insertAdjacentElement("beforeend", button);

    var modal = this.createModal(content);
    modal.onclick = this.removeModal;

    document.body.insertAdjacentElement("beforeend", modal);
  };

  this.removeModal = () => {
    var assistantWrapper = document.getElementById("kitt-assistant-modal");
    if (assistantWrapper) {
      clearInterval(this.kittNotification);
      this.synth.cancel();
      assistantWrapper.remove();
    }
  };

  this.notify = (message) => {
    this.beep.play();
    let synthSpeech = this.initSpeech(message);
    this.kittNotification = setInterval(() => {
      this.synth.speak(synthSpeech);
    }, this.notificationRate);
  };

  this.startAssistant = () => {
    this.toggleLabel.dataset.originalTitle = this.enabledTooltip;
    this.startingSound.play();
    this.toggleCheckbox.checked = true;
    this.assistant = setInterval(() => {
      var unassignedTicket = document.querySelector(
        ".ticket .ticket-teacher > i.fa-question"
      );
      var myTicket = document.querySelector(".ticket.is-mine");
      if (!this.onDuty && unassignedTicket) {
        if (!this.modalShowing()) {
          var message = "There's an unassigned ticket waiting.";

          var buttons = document.createElement("div");
          buttons.classList.add("ticket-actions", "w-100");
          var turnOffAssistantBtn = document.createElement("button");
          turnOffAssistantBtn.innerText = "Turn off the assistant";
          turnOffAssistantBtn.classList = "btn btn-default btn-sm";
          turnOffAssistantBtn.onclick = () => this.stopAssistant();
          buttons.insertAdjacentElement("beforeend", turnOffAssistantBtn);
          var getOnDutyBtn = document.createElement("button");
          getOnDutyBtn.innerText = "Put yourself on duty";
          getOnDutyBtn.classList = "btn btn-blue btn-sm m";
          getOnDutyBtn.onclick = () => {
            document.querySelector(".switch").click();
            this.onDuty = true;
          };
          buttons.insertAdjacentElement("beforeend", getOnDutyBtn);

          this.notify(message);
          this.displayTicketModal(message, buttons);
        }
      } else if (myTicket) {
        if (!this.ongoingTickets) {
          var studentName = myTicket.querySelector(".ticket .name").innerText;
          var ticketNumber = myTicket
            .querySelector(".ordinal-table .ordinal")
            .innerText.toLowerCase();
          var message = `You've been assigned ${studentName}'s ${ticketNumber}.`;
          this.notify(message);
          this.displayTicketModal(message);
          this.ongoingTickets = true;
        }
      } else {
        this.removeModal();
        this.ongoingTickets = false;
      }
    }, this.refreshRate);
  };
  this.stopAssistant = () => {
    this.toggleCheckbox.checked = false;
    this.toggleLabel.dataset.originalTitle = this.disabledTooltip;
    clearInterval(this.assistant);
  };
}
