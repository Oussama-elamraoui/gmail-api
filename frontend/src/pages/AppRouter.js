import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Navbar from "../components/Navbar";
import EmailSelection from "./EmailSelection"
import EmailDetails from "./EmailDetails";
const Navigation = () => {
    return (
        <Router>
            <Navbar />
            <div className="bg-gray-100 min-h-screen">
                <Routes>
                    <Route path="/" element={<EmailSelection/>}/>
                    <Route path="/email-list" element={<Home />} />
                    <Route path="/email/:id" element={<EmailDetails />} />
                </Routes>
            </div>
        </Router>
    );
};

export default Navigation;
