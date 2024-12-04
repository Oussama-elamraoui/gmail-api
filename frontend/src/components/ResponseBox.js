import React, { useState } from "react";
import '../styles/ResponseBox.css'
const ResponseBox = ({ email, response, onGenerateResponse }) => {
    const [customResponse, setCustomResponse] = useState(response);

    const handleSend = () => {
        alert("Email sent successfully!");
    };

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Email Thread</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm">{email.snippet}</p>
            </div>
            <h3 className="text-md font-medium mb-2">AI Response</h3>
            <textarea
                value={customResponse}
                onChange={(e) => setCustomResponse(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
                rows="5"
            ></textarea>
            <div className="flex space-x-2">
                <button
                    onClick={() => onGenerateResponse(email.snippet)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    Regenerate
                </button>
                <button
                    onClick={handleSend}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ResponseBox;
