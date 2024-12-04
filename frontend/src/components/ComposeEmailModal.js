import React, { useState } from "react";
import "../styles/ComposeEmailModal.css"; // Import custom styles

const ComposeEmailModal = ({ onClose }) => {
    const [emailDetails, setEmailDetails] = useState({
        to: "",
        subject: "",
        body: "",
    });
     
    const handleSendEmail = async () => {
        console.log(emailDetails)
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/send-email`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailDetails),
            });
            const data = await res.json();
            console.log("Email sent:", data);
            onClose(); // Close modal on success
        } catch (error) {
            console.error("Error sending email:", error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Compose Email</h2>

                {/* Input Fields */}
                <label className="modal-label">To:</label>
                <input
                    type="email"
                    placeholder="Recipient's email"
                    className="modal-input"
                    value={emailDetails.to}
                    onChange={(e) => setEmailDetails({ ...emailDetails, to: e.target.value })}
                />

                <label className="modal-label">Subject:</label>
                <input
                    type="text"
                    placeholder="Email subject"
                    className="modal-input"
                    value={emailDetails.subject}
                    onChange={(e) => setEmailDetails({ ...emailDetails, subject: e.target.value })}
                />

                <label className="modal-label">Body:</label>
                <textarea
                    placeholder="Email body"
                    className="modal-textarea"
                    value={emailDetails.body}
                    onChange={(e) => setEmailDetails({ ...emailDetails, body: e.target.value })}
                />

                {/* Action Buttons */}
                <div className="modal-actions">
                    <button className="modal-button cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="modal-button send" onClick={handleSendEmail}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComposeEmailModal;
