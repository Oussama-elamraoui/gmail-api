import React from "react";
import "../styles/Navbar.css";
const Navbar = () => {
    return (
        <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-10">
            <div className="container mx-auto flex justify-between items-center p-4">
                <h1 className="text-xl font-bold text-orange-500">AI Email Assistant</h1>
                <div className="text-gray-600">Welcome, User!</div>
            </div>
        </nav>
    );
};

export default Navbar;
