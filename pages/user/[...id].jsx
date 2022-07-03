import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';

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

    const accessResponse = await fetch(`${serverURL}/api/accessTokens?id=${athleteId}`, {
        method: 'GET',
        headers: headers
    });
    const accessResponseJSON = await accessResponse.json();
    const accessToken = accessResponseJSON.access_token;

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
    
    // // get required data
    // const activitiesURL = `https://www.strava.com/api/v3/clubs/${clubId}/activities?access_token=${accessToken}&page=2`;
    // const activityResponse = await fetch(activitiesURL);
    // const activityResponseJSON = await activityResponse.json();

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
                        <Link href={`https://www.strava.com/clubs/${club.id}`}>(Click here)</Link>
                        {` ${club.name}: ${club.member_count} members`}
                    </li>
                ))}
            </ol>
        </>
    )
}

export default function User(props) {
    const athlete = props.athlete;

    return (
        <>
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