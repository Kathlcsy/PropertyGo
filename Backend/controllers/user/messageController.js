const { Message, Chat } = require("../../models");

const addMessage = async (req, res) => {
    try {
        // Validate the request data (e.g., req.body) to ensure required fields are present
        const { messageText, chatId, userId } = req.body;
        if (!messageText || !chatId || !userId) {
            return res.status(400).json({ message: 'Invalid message data' });
        }

        // Create a new message associated with the chat
        const message = await Message.create(req.body);

        const chat = await Chat.findByPk(chatId)
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat Not Found' });
        }

        if (chat.senderId === userId) {
            chat.senderReplied = true;
        } else {
            chat.senderReplied = false;
        }

        chat.save()
        
        res.status(201).json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    addMessage
};