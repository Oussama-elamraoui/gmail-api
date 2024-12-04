import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import '../styles/EmailDetail.css'
const EmailDetails = () => {
    const { id } = useParams(); // Extract the email ID from the URL
    const [emailDetails, setEmailDetails] = useState([]);
    const [replyMessage, setReplyMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch email details
    useEffect(() => {
        const fetchEmailDetails = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/thread/${id}`, {
                    credentials: "include", // Send cookies with the request
                });
                const data = await res.json();
                setEmailDetails(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching email details:", err);
                setLoading(false);
            }
        };

        fetchEmailDetails();
    }, [id]);

    // Handle reply submission
    const handleReply = async (e) => {
        e.preventDefault();
        if(!replyMessage.trim()){
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/reply`, {
                method: "POST",
                credentials: "include", // Send cookies with the request
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    threadId: id,
                    message: replyMessage,
                }),
            });

            if (res.ok) {
                alert("Reply sent successfully!");
                setReplyMessage(""); // Clear the reply field
            } else {
                alert("Failed to send reply.");
            }
        } catch (err) {
            console.error("Error sending reply:", err);
        }
    };

    const generateAIResponse = async () => {
        setIsLoading(true);
        setReplyMessage(""); // Clear the zone text while loading
        console.log(emailDetails)
        const formattedThread = emailDetails
        .map(
            (email, index) =>
                `Email ${index + 1}:\nFrom: ${email.from}\nSubject: ${
                    email.subject
                }\nDate: ${new Date(email.timestamp).toLocaleString()}\nMessage:\n${
                    email.snippet
                }\n\n`
        )
        .join("");
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/generate-response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    threadDetails: formattedThread, // Send the thread details
                    from: emailDetails[0].from
                }),
            });
            const data = await res.json();
            setReplyMessage(data); // Set the AI-generated response
        } catch (err) {
            console.error("Error generating AI response", err);
        } finally {
            setIsLoading(false); // Hide the loader
        }
    };

    if (loading) {
        return <p>Loading email details...</p>;
    }

    return (
        <div className="email-details-container">
            <h2 className="text-lg font-semibold mb-4">Email Thread Details</h2>
            <div className="email-thread">
                {emailDetails.map((email, index) => (
                    <div key={email.id} className={`email-item ${index % 2 === 0 ? "even" : "odd"}`}>
                        <p><strong>From:</strong> {email.from}</p>
                        <p><strong>Subject:</strong> {email.subject}</p>
                        <div
                            className="email-body"
                            dangerouslySetInnerHTML={{ __html: email.snippet }}
                        />
                        <p className="email-timestamp">
                            <strong>Date:</strong> {new Date(email.timestamp).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
            <div className="response-zone">
                <div className="response-header">
                    <button
                        className="ai-generate-button"
                        onClick={generateAIResponse}
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Generate with AI"}
                    </button>
                </div>
                <form className="reply-form" onSubmit={handleReply}>
                    {isLoading ? (
                        <div className="loader">⏳ Loading AI response...</div>
                    ) : (
                        <textarea
                            className="reply-input"
                            placeholder="Type your reply here..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            required
                        />
                    )}
                    <button
                        className="reply-button"
                        type="submit"
                    >
                        Send Reply
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmailDetails;
