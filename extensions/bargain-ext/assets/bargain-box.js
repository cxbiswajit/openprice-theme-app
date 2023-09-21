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

    var userInputContainer = selectElement(".chatbot-input-form");
    if (userInputContainer) {
      userInputContainer.style.display = "flex";
    }

    // Clear the input field
    var buttons = selectElement(".button-container");
    if (buttons) {
      buttons.remove(); 
    }

    var userInputContainer = selectElement(".discount-text");
    if (userInputContainer) {
      userInputContainer.style.display = "none";
    }
    var userInputContainer = selectElement(".discount");
    if (userInputContainer) {
      userInputContainer.style.display = "none";
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
          if (response.includes("Are you ok with")) {
            // If the bot message contains the specific question
            replaceWithYesNoButtons();
            updateChatWindow(response, false); // false to indicate it's a received message
          }
          else if (response.includes("discount")) {
            // If the bot message contains the specific question
            displayDiscount(response); // false to indicate it's a received message
          }
          else {
            // For other messages, update the chat window
            updateChatWindow(response, false); // false to indicate it's a received message
          }
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
          sendMessage(event);
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

  function sendYesNoMessage(message) {
  
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
    var buttons = selectElement(".button-container");
    if (buttons) {
      buttons.style.display = "none";
    }

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

  // Function to replace user input and send button with yes and no buttons
  function replaceWithYesNoButtons() {
    var userInputContainer = selectElement(".chatbot-input-form");
    if (userInputContainer) {
      userInputContainer.style.display = "none";
    }

    var buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    var yesButton = document.createElement("button");
    yesButton.textContent = "Yes";
    yesButton.classList.add("yes-button");
    yesButton.addEventListener("click", function () {
      sendYesNoMessage("Yes");
    });

    var noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.classList.add("no-button");
    noButton.addEventListener("click", function () {
      sendYesNoMessage("No");
    });

    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);

    var parrent = selectElement(".chatbot-footer");
    parrent.appendChild(buttonContainer);
  }

  function displayDiscount(response) {
    var msg = calculatePercentageFromString(response);
    
    var discountText = selectElement(".discount-text");
    if (discountText) {
      discountText.style.display = "flex";
      discountText.textContent = msg;
    }
    var userInputContainer = selectElement(".discount");
    if (userInputContainer) {
      userInputContainer.style.display = "flex";
    }

    var userInputContainer = selectElement(".chatbot-input-form");
    if (userInputContainer) {
      userInputContainer.style.display = "none";
    }
  }
  

  function calculatePercentageFromString(input) {
    // Split the input string into an array using ":" as the delimiter
    const values = input.split(':');
  
    // Check if there are exactly three values in the array
    if (values.length !== 3) {
      return "Invalid input format. Please provide input in the format 'discount:part:whole'.";
    }
  
    // Parse the values as numbers
    const discount = parseFloat(values[1]);
    const actualPrice = parseFloat(values[2]);
  
    // Check if parsing was successful
    if (isNaN(discount) || isNaN(actualPrice)) {
      return "Invalid numeric values. Please provide valid numbers.";
    }
  
    // Calculate the discount percentage
    const discountPercentage = Math.round(((actualPrice - discount) / actualPrice) * 100);
  
    return `You got ${discountPercentage}% OFF`; // Display with two decimal places
  }
  
  document.body.appendChild(modal);
})();

