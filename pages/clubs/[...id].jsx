import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';

export async function getServerSideProps(req, res) {
    const clubId = parseInt(req.query.id);
    const athleteId = getCookie('athleteId', { req, res });
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteInfo = db.collection("athlete_info");

    // get valid access token from API endpoint
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const accessResponse = await fetch(`${serverURL}api/refreshTokens?id=${athleteId}`, {
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
    // get required data
    const activitiesURL = `https://www.strava.com/api/v3/clubs/{id}/activities?page=1&per_page=200access_token=${accessToken}`;
    const activitiesResponseJSON = await getData(activitiesURL);

    return ({
        props: {
            activities: activitiesResponseJSON
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

export default function Clubs(props) {
    if (props.errorCode) {
        return (<ClubNotFound />);
    }
    const athlete = props.athlete;

    return (
        <>
            <div className='header'>
                <h1>User: {`${athlete.first_name} ${athlete.last_name}`}</h1>
            </div>
            <div className='stats'>
                <ListClubs clubs={props.clubs}/>
            </div>

            <Link href="/">
                <a>Back to home</a>
            </Link>
        </>
    );
}