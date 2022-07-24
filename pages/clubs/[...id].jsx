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
            <div>
                <dl className={styles.statText}>
                    <dt className={styles.term}>Activities</dt>
                    <dd className={styles.description}>{(stats.activityCount).toLocaleString()}</dd>
                    <dt className={styles.term}>Distance</dt>
                    <dd className={styles.description}>{convertToMiles(stats.distance).toLocaleString()}mi</dd>
                    <dt className={styles.term}>Elevation Gain</dt>
                    <dd className={styles.description}>{convertToFeet(stats.elevGain).toLocaleString()}ft</dd>
                    <dt className={styles.term}>Elapsed Time</dt>
                    <dd className={styles.description}>{(stats.elapsedTime).toLocaleString()}sec</dd>
                    <dt className={styles.term}>Moving Time</dt>
                    <dd className={styles.description}>{(stats.movingTime).toLocaleString()}sec</dd>
                    <dt className={styles.term}>Kudos</dt>
                    <dd className={styles.description}>{(stats.kudos).toLocaleString()}</dd>
                    <dt className={styles.term}>PRs</dt>
                    <dd className={styles.description}>{(stats.prs).toLocaleString()}</dd>
                </dl>
            </div>
        </>
    )
}

function ClubHeader({ clubInfo }) {
    return (
        <>
            <Image className={styles.titleBackground}
                src={clubInfo.cover_photo ? clubInfo.cover_photo : "/strava_default_background.png"}
                layout='fill'
            />
            <Image className={styles.titleImage}
                src={clubInfo.profile=="avatar/club/large.png" ? "/large.png" : clubInfo.profile}
                layout='intrinsic'
                width={256}
                height={256}
            />
            <span className={styles.clubName}>{`${clubInfo.name}`}</span>
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
                    <ClubHeader clubInfo={props.clubInfo}/>
                </h1>
                <ClubStats stats={props.stats} />
                <ListActivities activities={props.activities} />
            </div>
        </>
    )
}