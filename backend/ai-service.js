import axios from 'axios';

class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.systemPrompt = `
You are a helpful assistant for "Flash Aid", a Lightning Network-based disaster relief donation platform.
Your goal is to help users navigate the app and understand Bitcoin and Lightning.

Key Information about Flash Aid:
- It allows instant donations using the Bitcoin Lightning Network.
- It provides transparent tracking of donations.
- It uses LND (Lightning Network Daemon) for processing payments.

Help Content:
1. What is Bitcoin? Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries.
2. What is Lightning? The Lightning Network is a "layer 2" payment protocol layered on top of Bitcoin. It is designed to enable fast, high-volume, low-fee transactions.
3. How to donate? Simply enter an amount in Satoshi (sats) on the donation page, click "Generate Invoice", and scan the QR code with your Lightning-enabled wallet (like Muun, Phoenix, or Wallet of Satoshi).

Keep your responses friendly, concise, and focused on helping the user with Flash Aid.
`;
    }

    async generateResponse(userMessage) {
        try {
            const response = await axios.post(`${this.apiUrl}?key=${this.apiKey}`, {
                contents: [
                    {
                        parts: [
                            { text: this.systemPrompt },
                            { text: userMessage }
                        ]
                    }
                ]
            });

            if (response.data && response.data.candidates && response.data.candidates[0].content) {
                return response.data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API Error:', error.response ? error.response.data : error.message);
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
        }
    }

    getHelpContent() {
        return {
            bitcoin: "Bitcoin is a decentralized digital currency. It allows for peer-to-peer transactions without intermediaries.",
            lightning: "The Lightning Network is a layer 2 protocol on Bitcoin that enables near-instant, low-fee transactions.",
            howToDonate: "To donate, enter the amount in sats, generate a Lightning invoice, and pay it using a Lightning wallet.",
            zarConverter: "You can use our converter to see how many sats you need for a specific ZAR or USD amount."
        };
    }

    getLessons() {
        return [
            {
                id: 1,
                title: "Introduction to Bitcoin",
                content: "Bitcoin is the first decentralized digital currency. It was created in 2009 by an anonymous person or group of people named Satoshi Nakamoto. Unlike traditional currencies, it's not controlled by any bank or government.",
                summary: "Bitcoin = Digital Gold & Peer-to-Peer Cash."
            },
            {
                id: 2,
                title: "How Bitcoin Works",
                content: "Bitcoin transactions are recorded on a public ledger called the Blockchain. This ledger is maintained by a global network of computers (miners) that ensure every transaction is valid and secure.",
                summary: "Blockchain ensures security without central authorities."
            },
            {
                id: 3,
                title: "The Lightning Network Explained",
                content: "The Lightning Network is like an Express Lane for Bitcoin. It allows people to send small amounts of Bitcoin instantly and for almost no cost by opening payment channels outside the main blockchain.",
                summary: "Lightning = Fast, cheap, and scalable Bitcoin payments."
            },
            {
                id: 4,
                title: "Why Use Lightning for Donations?",
                content: "Donating via Lightning means 100% of your contribution reaches the cause almost instantly. Smaller fees mean even micro-donations (like 1 cent) are possible and impactful.",
                summary: "Perfect for fast, transparent global aid."
            }
        ];
    }
}

export default AIService;
