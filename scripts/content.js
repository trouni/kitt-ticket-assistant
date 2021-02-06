const onTicketsPage =
  window.location.pathname.match(/^\/camps\/\d+\/tickets\/?$/) !== null;
const assistant = new TicketAssistant();

if (onTicketsPage)
  document.addEventListener("DOMContentLoaded", assistant.initialize);
