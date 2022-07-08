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
    const athleteClubs = db.collection("athlete_clubs");

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

    // see if club exists
    const updateClubs = async () => {
        const existing = await athleteClubs.findOne({ id: athleteId });
        const curTime = Math.floor(Date.now() / 1000);

        if (!existing || ((existing.lastUpdated + 86400) < curTime)) {
            // get required data from Strava
            const clubsURL = `https://www.strava.com/api/v3/athlete/clubs?access_token=${accessToken}`;
            const clubsResponseJSON = await getData(clubsURL);
            
            // update DB with new clubs, if user doesn't exist create a new entry.
            const clubsDBFilter = {
                id: athleteId
            }
            const clubsDBData = {
                $set: {
                    id: athleteId,
                    lastUpdated: curTime,
                    clubs: clubsResponseJSON
                }
            }
            await athleteClubs.findOneAndUpdate(clubsDBFilter, clubsDBData, { upsert: true });

            // return to populate page with data
            return clubsResponseJSON;
        } else {
            return existing.clubs;
        }
    }

    const clubs = await updateClubs();

    return ({
        props: {
            athlete: athleteJSON,
            clubs: clubs
        }
    });
}

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