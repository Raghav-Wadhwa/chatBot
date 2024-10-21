const messageInput = document.querySelector('.message-input');
const chatBody = document.querySelector('.chat-body');
const sendMessageButton = document.querySelector('#send-message');
const fileInput = document.querySelector('#file-input');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
const chatbotToggler = document.querySelector('#chatbot-toggler');
const closeChatbot = document.querySelector('#close-chatbot')

//API SETUP 
const API_KEY = "AIzaSyBsApgQmxAl8gICVKsqLMtLuae3kf5sAI8"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const chatHistory = [];

const userData = {
    message: null,
    file:{
        data: null,
        mime_type: null
    }
};

const generateBotResponse = async (incomingMessageDiv) => {
    //  chat history for user
    const messageElement = incomingMessageDiv.querySelector('.message-text');
    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{inline_data : userData.file}]: [])]
    })

    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    }

    try {
        const response = await fetch(API_URL,requestOptions);
        const data = await response.json();

        if(!response.ok){
            throw new Error(data.error.message);
        }
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,"$1").replaceAll( "*", "->").replaceAll("##" , " ").trim();
        messageElement.innerText = apiResponseText;
        //Add bot response to chat history
        chatHistory.push({
            role: "model",
            parts: [{ text: userData.message }]
        })
    }
    catch (error) {
        console.log(error);  
    }
    finally{
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking")
        chatBody.scrollTo({top: chatBody.scrollHeight,behavior: "smooth"})
    }
}

// Create message elements with dynamic classes and return it
const createMessageElement = (content, classes) => {
    const div = document.createElement('div');
    div.classList.add('message', classes);
    div.innerHTML = content;
    return div;
};

// Handle outgoing message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    messageInput.value = "";
    // Check if the message is not empty
    if (!userData.message) return;

    // Display the message
    const messageContent = `<div class="message-text"></div>
    ${userData.file.data ? `<img src = "data:${userData.file.mime_type};base64,${userData.file.data}" class = "attachment"/>` : ""}`;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);

    // Clear the input field after sending
    messageInput.value = '';

    // Smooth scroll to the bottom of the chat
    chatBody.scrollTop = chatBody.scrollHeight;

    // Simulate a bot response
    setTimeout(() => {
        const botMessageContent = `
            <button class="material-symbols-rounded logo2">
                smart_toy
            </button>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>`;
        const incomingMessageDiv = createMessageElement(botMessageContent, 'bot-message');
        chatBody.appendChild(incomingMessageDiv);
        generateBotResponse(incomingMessageDiv);
        // Scroll to the bottom again after the bot's message
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 600);
};

// Handling Enter key for user message
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleOutgoingMessage(e);
    }
});

sendMessageButton.addEventListener('click', (e) => {
    handleOutgoingMessage(e);
});

// handling attached file button 

document.querySelector('#file-upload').addEventListener('click', () => fileInput.click());
fileInput.addEventListener("change",() => {
    const file = fileInput.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector('img').src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        console.log('File uploaded, class added.');
        const base64String = e.target.result.split(",")[1];
        userData.file = {
            data: base64String,
            mime_type: file.type
        }
        fileInput.value = "";  
    }
    reader.readAsDataURL(file);
});


const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition : "none",
    onEmojiSelect : (emoji) => {
        const { selectionStart : start , selectionEnd : end } = messageInput;
        messageInput.setRangeText(emoji.native,start,end,"end");
        messageInput.focus();
    },
    onClickOutside : (e) => {
        if(e.target.id === "emoji-picker" ){
            document.body.classList.toggle("show-emoji-picker")
        }
        else{
            document.body.classList.remove("show-emoji-picker")
        }
    }
});

document.querySelector('.chat-form').appendChild(picker);
chatbotToggler.addEventListener('click' , () => {
    document.body.classList.toggle('show-chatbot')
});

closeChatbot.addEventListener('click',() => {
    document.body.classList.remove('show-chatbot')
})