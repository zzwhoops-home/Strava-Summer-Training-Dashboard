import Link from 'next/link';
import Image from "next/image";
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';
import { GetClubActivities, GetStats, UpdateClubData } from '../api/clubData';
import LoggedIn from '../../components/loggedIn';
import styles from '../../styles/Clubs.module.css'
import { useEffect } from 'react';

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
    const stats = await GetStats(clubId, activities);

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
    const convertString = (num, places) => {
        const formatted = num.toLocaleString(undefined, {minimumFractionDigits: places, maximumFractionDigits: places});
        return formatted;
    }
    const convertToMiles = (dist) => {
        return (dist / 1609);
    }
    const convertToFeet = (dist) => {
        return (dist * 3.2808399);
    }
    const convertToDuration = (time) => {
        const days = Math.floor(time / 86400);
        const hours = Math.floor((time - (days * 86400)) / 3600);
        const minutes = Math.floor((time - (days * 86400) - (hours * 3600)) / 60);
        return (`${days}d ${hours}h ${minutes}m`);
    }

    const activityCount = convertString(stats.activityCount, 0);
    const distance = convertString(convertToMiles(stats.distance), 2);
    const elevGain = convertString(convertToFeet(stats.elevGain), 0);
    const elapsedTime = convertToDuration(stats.elapsedTime);
    const movingTime = convertToDuration(stats.movingTime);
    const kudos = convertString(stats.kudos, 0);
    const prs = convertString(stats.prs, 0);
    
    return (
        <>
            <dl className={styles.statText}>
                <dt className={styles.term}>Activities</dt>
                <dd className={styles.description}>{activityCount}</dd>
                <dt className={styles.term}>Distance</dt>
                <dd className={styles.description}>{distance} mi</dd>
                <dt className={styles.term}>Elevation Gain</dt>
                <dd className={styles.description}>{elevGain} ft</dd>
                <dt className={styles.term}>Elapsed Time</dt>
                <dd className={styles.description} title={`${convertString(stats.elapsedTime)} sec`}>{elapsedTime}</dd>
                <dt className={styles.term}>Moving Time</dt>
                <dd className={styles.description} title={`${convertString(stats.movingTime)} sec`}>{movingTime}</dd>
                <dt className={styles.term}>Kudos</dt>
                <dd className={styles.description}>{kudos}</dd>
                <dt className={styles.term}>PRs</dt>
                <dd className={styles.description}>{prs}</dd>
                <dt className={styles.term}>Badges</dt>
                <dd className={styles.description}>?/69</dd>
            </dl>
        </>
    )
}

function ClubHeader({ clubInfo }) {
    const titleImageURL = clubInfo.profile=="avatar/club/large.png" ? "/large.png" : clubInfo.profile;
    const titleBackgroundURL = clubInfo.cover_photo ? clubInfo.cover_photo : "/strava_default_background.png";

    return (
        <>
            <div className={styles.titleBackground} style={{backgroundImage: `url(${titleBackgroundURL})`}}>
                <div className={styles.title}>
                    <div className={styles.titleImageContainer}>
                        <span className={styles.titleImage} style={{backgroundImage: `url(${titleImageURL})`}}></span>
                    </div>
                    <div className={styles.clubName}>{`${clubInfo.name}`}</div>
                </div>
            </div>
        </>
    )
}

function Badges({ badges }) {
    const arr = [0, 3, 4, 5, 10, 12, 15, 13, 12, 9, 0, 3, 4, 5, 10, 12, 15, 13, 12, 9, 15, 8, 9, 8, 7, 6, 2, 3, 1, 0];
    return (
        <>
            <div className={styles.badges}>
                <div className={styles.badgeTitle}>Badges</div>
                <div className={styles.badgeGroup}>
                    <div className={styles.distanceBadgeGroup}>
                        {arr.map((num=value) => {
                            return (<div className={styles.badge}>
                                <strong>{num}</strong>
                            </div>);
                        })}
                    </div>
                    <div className={styles.badgeGroupLabel}>Going the distance</div>
                </div>
            </div>
        </>
    );
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
                <ClubHeader clubInfo={props.clubInfo}/>
                <div className={styles.statBorder}>
                    <h2>Leaderboard Placeholder</h2>
                    <ClubStats stats={props.stats} />
                </div>
                <Badges />
                {/* <ListActivities activities={props.activities} /> */}
            </div>
        </>
    )
}