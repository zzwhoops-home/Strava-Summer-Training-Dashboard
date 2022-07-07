import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import Error from 'next/error';
import UserNotFound from './user404';
import { getCookie } from 'cookies-next';
import LoggedIn from '../../components/loggedIn';

export async function getServerSideProps(req, res) {
    const athleteId = parseInt(req.query.id);
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteInfo = db.collection("athlete_info");

    // get valid access token from API endpoint
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const accessResponse = await fetch(`${serverURL}/api/refreshTokens?id=${athleteId}`, {
        method: 'GET',
        headers: headers
    });
    const errorCode = accessResponse.ok ? false : accessResponse.status;
    if (errorCode) {
        return ({
            props: {
                errorCode: errorCode
            }
        });
    }
    const accessResponseJSON = await accessResponse.json();
    const accessToken = accessResponseJSON.valid_access_token;

    const getData = async (url) => {
        const response = await fetch(url);
        return await response.json();
    }
    // get athlete information
    const athlete = await athleteInfo.findOne({ id: athleteId });
    const athleteJSON = await JSON.parse(JSON.stringify(athlete));

    // get required data
    const clubsURL = `https://www.strava.com/api/v3/athlete/clubs?access_token=${accessToken}`;
    const clubsResponseJSON = await getData(clubsURL);

    return ({
        props: {
            athlete: athleteJSON,
            clubs: clubsResponseJSON
        }
    });
}

    /*
    const data = await access_tokens.find({}).toArray();
    console.log(data);
    */

function ListClubs({ clubs }) {
    return (
        <>
            <ol style={{listStyleType: "none"}}>
                {clubs.map((club=value) => (
                    <li key={club.id}>
                        <Link href={`${serverURL}/clubs/${club.id}`}>(Click here)</Link>
                        {` ${club.name}: ${club.member_count} members`}
                    </li>
                ))}
            </ol>
        </>
    )
}

export default function Users(props) {
    if (props.errorCode) {
        return (<UserNotFound />);
    }
    const athlete = props.athlete;

    const [id, setId] = useState();
    
    useEffect(() => {
        setId(getCookie('athleteId'))
    }, []);
    
    return (
        <>
            <LoggedIn id={id}/>
            <div className='header'>
                <h1>User: {`${athlete.first_name} ${athlete.last_name}`}</h1>
            </div>
            <div className='clubs'>
                <ListClubs clubs={props.clubs}/>
            </div>

            <Link href="/">
                <a>Back to home</a>
            </Link>
        </>
    );
}