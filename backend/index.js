require('dotenv').config();
const express = require('express');
const cors = require('cors');
const base64=require('js-base64')
const {google} = require('googleapis');
const quotedPrintable = require("quoted-printable");
const cookieParser = require('cookie-parser');


const { GoogleGenerativeAI } = require("@google/generative-ai");

// configuration
const corsOptions = {
    origin:  process.env.FRONTEND_URL, // Frontend origin
    credentials: true, // Allow cookies and other credentials
};
const app = express();
app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());
const port = 5000;

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const scopes = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.modify','https://www.googleapis.com/auth/gmail.send'];
const url = oauth2Client.generateAuthUrl({
    access_type:'offline',
    scope:scopes,
    // prompt: 'consent'
});



// API
app.get('/', async (req, res) => {
    try {
        const accessToken = req.cookies.access_token;
        if (!accessToken) {
            return res.send(`<a href="${url}">Auth with Google</a>`);
        }
        const oauth2 = google.oauth2('v2');
        oauth2.setCredentials({ access_token: accessToken });
        try {
            const tokenInfo = await oauth2.tokeninfo({ access_token: accessToken });
            if (tokenInfo) {
                return res.redirect(`${process.env.FRONTEND_URL}`);
            }
        } catch (error) {
            console.error('Invalid or expired access token:', error);
        }
        res.send(`<a href="${url}">Auth with Google</a>`);
    } catch (error) {
        console.error('Error processing request:', error);
        res.send(`<a href="${url}">Auth with Google</a>`);
    }
});

app.post('/validate-token', async (req, res) => {
    const accessToken = req.cookies.access_token; // Read token from the cookie

    if (!accessToken) {
        return res.status(401).send('No token provided');
    }

    try {
        oauth2Client.setCredentials({ access_token: accessToken });
        const tokenInfo = await oauth2Client.getTokenInfo(accessToken);

        if (tokenInfo) {
            // Refresh token if needed (optional for short-lived tokens)
            if (tokenInfo.expiry_date && tokenInfo.expiry_date - Date.now() < 5 * 60 * 1000) { // < 5 minutes left
                const refreshedTokens = await oauth2Client.refreshAccessToken();
                const newAccessToken = refreshedTokens.credentials.access_token;

                res.cookie('access_token', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Secure in production
                    sameSite: 'Strict',
                    maxAge: 3600 * 1000, // 1 hour validity
                });
                console.log('my access token in validate: ', newAccessToken)

                return res.status(200).send('Token is valid and refreshed');
            }

            return res.status(200).send('Token is valid');
        }
    } catch (error) {
        console.error('Invalid or expired token:', error);
        return res.status(401).send('Invalid or expired token');
    }
});



app.post('/google-callback', async (req, res) => {
    try {
        const { code } = req.body; // Receive the code from the frontend
        const { tokens } = await oauth2Client.getToken(code); // Exchange the code for tokens
        // Set the access token as a secure, HTTP-only cookie
        res.cookie('access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set true in production for HTTPS
            sameSite: 'Strict',
            maxAge: tokens.expiry_date - Date.now(),
        });
        console.log('My new access token in callback',tokens.access_token)
        res.status(200).send('Authentication successful');
    } catch (error) {
        console.error('Error during token exchange:', error);
        res.status(500).send('Failed to authenticate');
    }
});
// new code  

app.get('/emails', async (req, res) => {
    try {
        const accessToken = req.cookies.access_token;
        oauth2Client.setCredentials({ access_token: accessToken });
        const emailList = await getEmailList(oauth2Client);
        res.json(emailList); // Send minimal email list as JSON
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching email list.');
    }
});
async function getEmailList(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Fetch the list of messages
    const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 12, // Fetch more messages if needed
    });

    const messages = response.data.messages || [];
    const emailSummaries = await Promise.all(
        messages.map(async (message) => {
            const email = await gmail.users.messages.get({ id: message.id, userId: 'me' });

            const headers = email.data.payload.headers;
            const subject = headers.find((e) => e.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((e) => e.name === 'From')?.value || 'Unknown';
            const timestamp = email.data.internalDate; // Email timestamp in milliseconds since epoch
            const snippet = email.data.snippet || ''; // Short preview of the message
            const threadId = email.data.threadId; // Thread ID of the email

            return {
                id: message.id,
                threadId,
                subject,
                from,
                timestamp: new Date(parseInt(timestamp)), // Convert timestamp to a Date object
                snippet,
            };
        })
    );

    // Group emails by threadId and keep only the latest message in each thread
    const threads = emailSummaries.reduce((acc, email) => {
        const existingThread = acc[email.threadId];
        if (!existingThread || email.timestamp > existingThread.timestamp) {
            acc[email.threadId] = email; // Keep the latest email in the thread
        }
        return acc;
    }, {});

    return Object.values(threads); // Return an array of the latest messages in each thread
}



app.get('/emails/:id', async (req, res) => {
    try {
        const emailId = req.params.id;
        const emailDetails = await getEmailDetails(emailId, oauth2Client);
        res.json(emailDetails); // Send detailed email information as JSON
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching email details.');
    }
});



async function getEmailDetails(emailId, auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const response = await gmail.users.messages.get({ id: emailId, userId: 'me' });
    const email = response.data;
    
    const subject = email.payload.headers.find((e) => e.name === 'Subject')?.value || 'No Subject';
    const from = email.payload.headers.find((e) => e.name === 'From')?.value || 'Unknown';
    console.log('the parts', email.payload.parts[0])
    const newBody =email.payload.parts[0].body.data
    // body = base64.decode(newBody.replace(/-/g, '+').replace(/_/g, '/'));
    // const body = getBodyFromEmail(email);
    // const body=email?.snippet
    let body
    if (email.payload?.parts) {
        // Handles multipart emails
        const part = email.payload.parts.find(p => p.mimeType === 'text/plain');
        if (part?.body?.data) {
            const decodedBody = base64.decode(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            const decodedContent = quotedPrintable.decode(decodedBody);
            body = decodedContent || "No Content";
        }
    } else if (email.payload?.body?.data) {
        // Handles single-part emails
        const decodedBody = base64.decode(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        const decodedContent = quotedPrintable.decode(decodedBody);
        body = decodedContent || "No Content";
    }
    return { id: emailId, subject, from, body };
}


app.post('/send-email', async (req, res) => {
    try {
        const accessToken = req.cookies.access_token;
        const { to, subject, body } = req.body; // Extract email details from request body
        oauth2Client.setCredentials({ access_token: accessToken });
        // Validate input
        if (!to || !subject || !body) {
            return res.status(400).send('Missing required fields: to, subject, body');
        }

        const rawEmail = createEmail({ to, subject, body });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Send email using Gmail API
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawEmail,
            },
        });

        res.status(200).json({ message: 'Email sent successfully!', response });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email.');
    }
});

// Helper function to create the email in raw format
function createEmail({ to, subject, body }) {
    const emailLines = [
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        body,
    ];

    const email = emailLines.join('\r\n');
    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// generate response
let model;
(async () => {
    model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
})();


app.post('/generate-response', async(req,res)=>{
    const  {threadDetails,from}=req.body;
    if (!threadDetails) {
        return res.status(400).json({ error: "Client email with body is required" });
    }
    try{
        const prompt = `
            You are a professional email assistant. Review the provided email thread and craft a professional and appropriate response to the last email in the thread. Do not include a subject.

            Sender's name: "${process.env.AUTHOR_NAME}"
            Email Thread: "${threadDetails}"
            The email is being sent to: "${from}"

            Your response should maintain a formal tone and address any queries or concerns raised in the last email.
        `;
    const response = await run(prompt)
    res.json(response)
    }catch{
       res.status(400).json({ error: "Sorry something wrong!" });
    }
});
async function run(prompt) {
    const result = await model.generateContent(prompt);
    return result.response.text()
  }


app.get('/thread/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const accessToken = req.cookies.access_token;
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Fetch the full thread
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
        });

        // Extract all messages in the thread
        const messages = thread.data.messages.map((msg) => {
            const headers = msg.payload.headers;
            const subject = headers.find((e) => e.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((e) => e.name === 'From')?.value || 'Unknown';
            const timestamp = msg.internalDate; // Email timestamp in milliseconds since epoch
            const snippet = msg.snippet || '';

            return {
                id: msg.id,
                subject,
                from,
                timestamp: new Date(parseInt(timestamp)), // Convert timestamp to a Date object
                snippet,
            };
        });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching thread details.');
    }
});

app.post('/reply', async (req, res) => {
    const { threadId, message } = req.body;

    try {
        const accessToken = req.cookies.access_token;
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Fetch the original thread to retrieve header info for the reply
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
        });

        if (!thread.data.messages || thread.data.messages.length === 0) {
            return res.status(400).send('Thread not found or empty.');
        }

        // Get the last message in the thread for reply headers
        const lastMessage = thread.data.messages[thread.data.messages.length - 1];
        const lastMessageId = lastMessage.id;

        const headers = lastMessage.payload.headers;
        const subject = headers.find((e) => e.name === 'Subject')?.value || 'No Subject';
        const to = headers.find((e) => e.name === 'From')?.value;

        if (!to) {
            return res.status(400).send('Unable to determine recipient from thread.');
        }

        // Compose the reply email
        const replyHeaders = [
            `From: me`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `In-Reply-To: ${lastMessageId}`,
            `References: ${lastMessageId}`,
        ];

        const rawMessage = [
            ...replyHeaders,
            '',
            message,
        ].join('\r\n');

        // Base64 encode the raw message
        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Send the reply
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
                threadId: threadId,
            },
        });

        res.status(200).send('Reply sent successfully!');
    } catch (err) {
        console.error('Error sending reply:', err);
        res.status(500).send('Failed to send reply.');
    }
});

app.listen(port,()=>{
    console.log('Server running');
})

