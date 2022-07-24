import Link from 'next/link';
import Image from "next/image";
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';
import { GetClubActivities, GetStats, UpdateClubData } from '../api/clubData';
import LoggedIn from '../../components/loggedIn';
import styles from '../../styles/Clubs.module.css'

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
        });
    }
    const accessToken = accessRes.valid_access_token;

    // call api functions for data
    const clubInfo = await UpdateClubData(clubId, athleteId, accessToken);
    const activities = await GetClubActivities(clubId);
    const stats = await GetStats(activities);

    return ({
        props: {
            clubInfo: clubInfo,
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
    );
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
            <div className={styles.subtitle}>
                <p>Club Statistics</p>
            </div>
            <div className={styles.statText}>
                <p>Activities: {(stats.activityCount).toLocaleString()}</p>
                <p>Distance: {convertToMiles(stats.distance).toLocaleString()}mi</p>
                <p>Elevation Gain: {convertToFeet(stats.elevGain).toLocaleString()}ft</p>
                <p>Elapsed Time: {(stats.elapsedTime).toLocaleString()}sec</p>
                <p>Time Spent Running: {(stats.movingTime).toLocaleString()}sec</p>
                <p>Kudos: {(stats.kudos).toLocaleString()}</p>
                <p>PRs: {(stats.prs).toLocaleString()}</p>
            </div>
        </>
    )
}

export default function Clubs(props) {
    if (props.errorCode) {
        return (<ClubNotFound />);
    }
    return (
        <>
            <div className='loggedin'>
                <LoggedIn />
                <nav>
                    <Link href="/">
                        <a>Back to home</a>
                    </Link>
                </nav>
            </div>
            <div className='content'>                        
                <h1 className={styles.title}>
                    <span className={styles.titleImageBorder}>
                        <Image className={styles.titleImage}
                            src={props.clubInfo.profile}
                            layout='intrinsic'
                            width={256}
                            height={256}
                        />
                    </span>
                    <span className={styles.clubName}>{`${props.clubInfo.name}`}</span>
                </h1>
                <ClubStats stats={props.stats} />
                <ListActivities activities={props.activities} />
            </div>
        </>
    )
}