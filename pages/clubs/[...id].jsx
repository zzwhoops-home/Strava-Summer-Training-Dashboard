import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';
import { GetClubActivities, GetStats, UpdateClubData } from '../api/clubData';

export async function getServerSideProps(req, res) {
    const clubId = await parseInt(req.query.id);
    const athleteId = await parseInt(req.req.cookies.athleteId);

    // const clubDBData = {
    //     clubId: clubId,
    //     users: Array[athleteIds],
    //     memberCount: member_count
    // }

    // GET valid access token from API endpoint
    const accessRes = await GetAccessToken(athleteId);
    if (accessRes.errorCode) {
        return ({
            props: {
                errorCode: accessRes.errorCode
            }
        })
    }
    const accessToken = accessRes.valid_access_token;

    // reversing to ensure that the newest activities are first
    const clubName = await UpdateClubData(clubId, athleteId, accessToken);
    const activities = await GetClubActivities(clubId);
    const stats = await GetStats(activities);

    return ({
        props: {
            clubName: clubName,
            activities: activities,
            stats: stats
        }
    });
}

function ListActivities({ activities }) {
    // const activitiesOnly = activities.map((activity=value) => activity.activities).flat().sort((a, b) => (a.kudos < b.kudos) ? 1 : -1);
    const activitiesOnly = activities.map((activity=value) => activity.activities).flat();
    
    return (
        <>
            <ol style={{listStyleType: "none"}}>
                {activitiesOnly.map((activity=value, index=index) => (
                    <li index={activity.activityId}>{`(${index}) ${activity.name}: ${activity.distance}m ${activity.kudos} kudos`}</li>
                ))}
            </ol>
        </>
    )
}

function ClubStats({ stats }) {
    // let stats = {
    //     activityCount: 0,
    //     distance: 0.0,
    //     elevGain: 0.0,
    //     elapsedTime: 0.0,
    //     movingTime: 0.0,
    //     kudos: 0,
    //     prs: 0
    // }
    const convertToMiles = (dist) => {
        return (dist / 1609);
    }
    const convertToFeet = (dist) => {
        return (dist * 3.2808399);
    }

    return (
        <>
            <h2>Activities: {(stats.activityCount).toLocaleString()}</h2>
            <h2>Distance: {convertToMiles(stats.distance).toLocaleString()}mi</h2>
            <h2>Elevation Gain: {convertToFeet(stats.elevGain).toLocaleString()}ft</h2>
            <h2>Elapsed Time: {(stats.elapsedTime).toLocaleString()}sec</h2>
            <h2>Time Spent Running: {(stats.movingTime).toLocaleString()}sec</h2>
            <h2>Kudos: {(stats.kudos).toLocaleString()}</h2>
            <h2>PRs: {(stats.prs).toLocaleString()}</h2>
        </>
    )
}

export default function Clubs(props) {
    if (props.errorCode) {
        return (<ClubNotFound />);
    }
    return (
        <>
            <div className='header'>
                <h1>Club: {`${props.clubName}`}</h1>
            </div>
            <div className='homePageLink'>
                <Link href="/">
                    <a>Back to home</a>
                </Link>
            </div>
            <div className='clubStats'>
                <ClubStats stats={props.stats} />
            </div>
            <ListActivities activities={props.activities} />
        </>
    )
}