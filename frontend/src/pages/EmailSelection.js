import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmailSelection = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const code = query.get('code');
        if (code) {
            (async () => {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/google-callback`, {
                        method: 'POST',
                        credentials: "include",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code }),
                    });

                    if (response.ok) {
                        // Authentication successful, navigate to email list
                        navigate('/email-list');
                    } else {
                        console.error('Authentication failed');
                    }
                } catch (error) {
                    console.error('Error during OAuth callback:', error);
                }
            })();
        }else{
          window.location.href = `${process.env.REACT_APP_API_BASE_URL}`;
        }
    }, [navigate]);

    return <div>Authenticating...</div>;
};

export default EmailSelection;
