import { getCookie } from 'cookies-next';
import { useState, useEffect } from 'react';

export default function LoggedIn() {
    const [id, setId] = useState();
    
    useEffect(() => {
        setId(getCookie('athleteId'))
    }, []);

    if (id) {
        return (
            <>
                <i>{`Logged in as user with ID: ${id}`}</i>
            </>
        );
    } else { 
        return (
            <i>Not logged in</i>
        );
    }
}