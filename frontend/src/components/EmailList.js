import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EmailList.css";

const EmailList = ({ emails }) => {
    const navigate = useNavigate();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const emailsPerPage = 8;

    // Pagination logic
    const indexOfLastEmail = currentPage * emailsPerPage;
    const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
    const currentEmails = emails.slice(indexOfFirstEmail, indexOfLastEmail);
    const totalPages = Math.ceil(emails.length / emailsPerPage);

    const handleEmailClick = (emailId) => {
        navigate(`/email/${emailId}`);
    };

    const changePage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="email-list-container">
            <h2 className="email-list-title">Inbox</h2>
            <ul className="email-list">
                {currentEmails.map((email) => (
                    <li
                        key={email.id}
                        onClick={() => handleEmailClick(email.threadId)}
                        className="email-list-item"
                    >   
                        <p className="email-from">{email.from}</p>
                        <p className="email-snippet">{email.snippet}</p>
                        <p className="email-thread-id">{email.timestamp}</p>
                    </li>
                ))}
            </ul>
            <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => changePage(index + 1)}
                        className={`pagination-btn ${
                            currentPage === index + 1 ? "active" : ""
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EmailList;
