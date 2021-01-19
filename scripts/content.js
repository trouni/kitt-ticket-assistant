const synth = window.speechSynthesis;
let ongoingTicket = false
let ticketID = 0
let muteAnnouncement = false

const resetAssistant = _ => {
  ongoingTicket = false
  muteAnnouncement = false
}

const initializeVoiceMessage = (studentName) => {
  window.announcement = new SpeechSynthesisUtterance(`You have a ticket from ${studentName}.`);
  window.announcement.voice = synth.getVoices()[49]
}

const initUI = (studentName) => {
  const assistantWrapper = document.createElement('div')
  assistantWrapper.id = "kitt-assistant-modal"

  const heading = document.createElement('h3')
  heading.innerText = `You have a new ticket from ${studentName}.`

  const button = document.createElement('button')
  button.classList.add("btn btn-warning btn-sm")
  button.innerText = "OK (mute assistant)"
  button.onclick = _ => {
    muteAnnouncement = true
    assistantWrapper.remove()
  }

  assistantWrapper.insertAdjacentElement('afterbegin', button)
  assistantWrapper.insertAdjacentElement('afterbegin', heading)
  document.body.insertAdjacentElement('afterbegin', assistantWrapper)
}

window.setInterval(_ => {
  var ticketDiv = document.querySelector(".ticket.is-mine")
  if (ticketDiv) {
    if (!ongoingTicket) {
      initializeVoiceMessage(studentName)
      ticketID += 1
      initUI(studentName)
      ongoingTicket = true
    }

    if (!muteAnnouncement) speechSynthesis.speak(window.announcement);
  } else {
    resetAssistant()
  }
}, 5000)




