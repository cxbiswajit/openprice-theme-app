(function() {
  var isChatOpen = false;

  function generateSessionId() {
    return "session_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  }

  // Function to handle changes in the input field and update send button color
  function changeSendButtonColor() {
    var userInput = selectElement(".user-input");
    var sendIcon = selectElement(".send-icon");

    if (userInput.value.trim().length > 0) {
      // If text is entered in the chatbox, change the SVG fill color to blue
      sendIcon.setAttribute("fill", "#87ceeb");
    } else {
      // If the chatbox is empty, revert the SVG fill color to white
      sendIcon.setAttribute("fill", "#000");
    }
  }

  function clearChatBody() {
    // Clear the chat body by removing all child elements
    var chatBody = document.querySelector(".chatbot-body");
    while (chatBody.firstChild) {
      chatBody.removeChild(chatBody.firstChild);
    }
  }

  function selectElement(selector, node) {
    return (node || document).querySelector(selector);
  }

  const modal = selectElement(".modal-container");
  var userSessionId = null; // Initialize userSessionId as null

  function createChatWindow() {

    // Generate a unique session ID for the user
    userSessionId = generateSessionId();

    var socket = new SockJS('https://chat.openpricetech.com/chat');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
      console.log('Connected: ' + frame);
      console.log('Connected to WebSocket server');  
      stompClient.subscribe('/user/queue/msg', function(message) {
        var body = JSON.parse(message.body);
        var botResponses = body.responses; // Accessing the 'responses' field from the received message
  
        // Now 'botResponses' is an array of bot responses
        botResponses.forEach(function(response) {
          console.log('Received bot response:', response);
          updateChatWindow(response, false); // false to indicate it's a received message
        });
        // Scroll to the last message
        var chatBody = selectElement(".chatbot-body");
        chatBody.scrollTop = chatBody.scrollHeight;
      });

      modal.classList.add('open');
      
       // Set the user session ID in the headers
      var headers = { "userSessionId": userSessionId };

      // Create an object representing the message format
      var messageObject = {
        sender: userSessionId, 
        isInitiate: true,  
        productId: "ABC12",  
        content: "" 
      };

      // Convert the message object to a JSON string
      var jsonString = JSON.stringify(messageObject);

      // Send the user message to the WebSocket server using STOMP
      stompClient.send('/app/msg', headers, jsonString);

      // Set the chat window as open
      isChatOpen = true;
    });

    // Scroll to the last message
    var chatBody = selectElement(".chatbot-body");
    chatBody.scrollTop = chatBody.scrollHeight;

    // Add event listener to the button that sends user message
    var sendButton = selectElement(".send-btn");
    if (sendButton) {
      sendButton.addEventListener("click", sendMessage);
    }

    // Add event listener to the input field to handle "input" event
    var userInput = selectElement(".user-input");
    if (userInput) {
      userInput.addEventListener("input", changeSendButtonColor);
    }

    // Add event listener to the input field to handle "Enter" key press
    var userInput = selectElement("#user-input");
    if (userInput) {
      userInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          sendMessage();
        }
      });
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    var userInput = selectElement("#user-input");
    var message = userInput.value.trim();
    if (message === "") {
      return;
    }

    // Update the chat window with the user message
    updateChatWindow(message, true); // true to indicate it's a user message

    if (!userSessionId) {
      // If userSessionId is not set, create a new session for the user
      userSessionId = generateSessionId();
    }

    // Set the user session ID in the headers
    var headers = { "userSessionId": userSessionId };

    // Create an object representing the message format
    var messageObject = {
      sender: userSessionId, 
      isInitiate: false,  
      productId: "ABC12",  
      content: message 
    };

    // Convert the message object to a JSON string
    var jsonString = JSON.stringify(messageObject);

    // Send the user message to the WebSocket server using STOMP
    stompClient.send('/app/msg', headers, jsonString);

    // Clear the input field
    userInput.value = "";

  }

  function updateChatWindow(message, isUserMessage) {
    // Create a new chat message element
    var messageElement = document.createElement("div");
    messageElement.classList.add(isUserMessage ? "user-message" : "bot-message");
  
    // Create a wrapper div for the message content
    var messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");
  
    // Create a span for the message content
    var messageContent = document.createElement("span");
    messageContent.textContent = message;
  
    // Append the message content to the wrapper
    messageElement.appendChild(messageContent);
  
    // Append the wrapper to the message element
    messageWrapper.appendChild(messageElement);
  
    // Get the chat body
    var chatBody = document.querySelector(".chatbot-body");
  
    // Append the message element to the chat body
    chatBody.appendChild(messageWrapper);
  
    // Scroll to the last message
    chatBody.scrollTop = chatBody.scrollHeight;

    if (isUserMessage) {
      messageWrapper.style.justifyContent = "flex-end";
    }
  }
  

  // Add event listener to the button that triggers the chat window creation
  var chatButton = selectElement(".bargain-buy-button");
  if (chatButton) {
    chatButton.addEventListener("click", function() {
      // Check if the chat window is already open
      if (!isChatOpen) {
        createChatWindow();
      }
    });
  }

  function disconnect() {
    if(stompClient != null) {
        stompClient.disconnect();
    }
    console.log("Disconnected");
    // Remove user session when chat window is closed
    userSessionId = null;
    localStorage.removeItem("userSessionId");    
    // Set the chat window as closed
    isChatOpen = false;
    clearChatBody();
  }
  // Add event listener to the close button to close the modal
  const closeIcon = selectElement(".close-icon");
  if (closeIcon) {
    closeIcon.addEventListener("click", function() {
      modal.classList.remove('open');
      disconnect();
    });
  }
  
  document.body.appendChild(modal);
})();
