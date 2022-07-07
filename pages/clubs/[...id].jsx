import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';

export async function getServerSideProps(req, res) {
    const clubId = parseInt(req.query.id);
    const athleteId = req.req.cookies.athleteId;
    console.log(athleteId);
    // const client = await clientPromise;
    // const db = client.db(process.env.DB);

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
    // get club name again - create api endpoint to add to db so we don't have to waste requests
    const clubURL = `https://www.strava.com/api/v3/clubs/${clubId}?access_token=${accessToken}`;
    const clubResponse = await getData(clubURL);

    // get required data
    const activitiesURL = `https://www.strava.com/api/v3/clubs/${clubId}/activities?page=1&per_page=100&access_token=${accessToken}`;
    const activitiesResponseJSON = await getData(activitiesURL);

    return ({
        props: {
            clubName: clubResponse.name,
            activities: activitiesResponseJSON
        }
    });
}

function ListActivities({ activities }) {
    return (
        <>
            <ol style={{listStyleType: "none"}}>
                {activities.map((activity=value, index=index) => (
                    <li key={index}>
                        <p>{`(${index} - ${activity.athlete.firstname} ${activity.athlete.lastname})`} <strong>{`${activity.name}:`}</strong> {`${activity.distance}m, ${activity.total_elevation_gain}m gain, Moving: ${activity.moving_time} Elapsed: ${activity.elapsed_time} (-${activity.elapsed_time - activity.moving_time})`}</p>
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
    const activities = props.activities;
    let dist = 0;
    activities.forEach(distanceSum);
    function distanceSum(activity) {
        dist += activity.distance;
    }

    return (
        <>
            <div className='header'>
                <h1>Club: {`${props.clubName}`}</h1>
            </div>
            <h1>Total Distance: {`${dist.toLocaleString()}m`}</h1>
            <div className='activities'>
                <ListActivities activities={activities}/>
            </div>

            <Link href="/">
                <a>Back to home</a>
            </Link>
        </>
    );
}