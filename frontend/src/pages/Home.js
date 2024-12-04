import React, { useEffect, useState } from "react";
import EmailList from "../components/EmailList";
import ResponseBox from "../components/ResponseBox";
import ComposeEmailModal  from "../components/ComposeEmailModal";

const Home = () => {
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
   
    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/emails`, {
                    credentials: 'include', // Send cookies with the request
                });
                if (!res.ok) throw new Error("Failed to fetch emails");
                const data = await res.json();
                setEmails(data); // Update the email list state
            } catch (err) {
                console.error("Error fetching emails:", err);
            }
        };        
        fetchEmails(); 
        
    }, []);

    return (
        <div className="home-container">
            <button className="compose-button" onClick={() => setIsModalOpen(true)}>
                Compose Email
            </button>
            
            <div className="email-list-container">
                    <EmailList emails={emails} onSelect={setSelectedEmail} />
                </div>
                {isModalOpen && <ComposeEmailModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Home;
