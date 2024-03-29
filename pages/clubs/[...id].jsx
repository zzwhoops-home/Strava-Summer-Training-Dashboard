import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ClubNotFound from './club404';
import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';
import { GetBadges, GetClubActivities, GetClubStats, IsClubMember, UpdateClubData } from '../api/clubData';
import LoggedIn from '../../components/loggedIn';
import styles from '../../styles/Clubs.module.css'

export async function getServerSideProps(req, res) {
    const clubId = await parseInt(req.query.id);
    const athleteId = await parseInt(req.req.cookies.athleteId);
    
    // check athlete is even part of the club
    const isClubMember = await IsClubMember(clubId, athleteId);
    if (!isClubMember) {
        return ({
            props: {
                errorCode: 404
            }
        })
    }

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
    const stats = await GetClubStats(clubId, activities);
    const badges = await GetBadges(clubId);

    return ({
        props: {
            clubInfo: clubInfo,
            activities: activities,
            stats: stats,
            badges: badges
        }
    });
}

function ListActivities({ activities }) {
    // const activitiesOnly = activities.map((activity=value) => activity.activities).flat().sort((a, b) => (a.distance < b.distance) ? 1 : -1);
    const activitiesOnly = activities.map((activity=value) => activity.activities).flat();
    // console.log(activitiesOnly)
    
    return (
        <>
            <ol style={{listStyleType: "none"}}>
                {activitiesOnly.map((activity=value, index=index) => (
                    <li index={activity.activityId}>{`(${index}) ${activity.athleteId} ${activity.name}: ${activity.distance}m ${activity.kudos} kudos`}</li>
                ))}
            </ol>
        </>
    );
}

function ClubStats({ stats, badgeCount }) {
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
                <dd className={styles.description}>{badgeCount}/24</dd>
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
                    <div className={styles.titleImage}>
                        <img
                            src={titleImageURL}
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <div className={styles.clubName}>{`${clubInfo.name}`}</div>
                </div>
            </div>
        </>
    )
}

function Badges({ stats, badges }) {
    const { distance, elevGain } = stats;

    // filter out the badges of each type and sort them by distance required to be displayed
    const distanceBadges = badges.filter((badge=value) => badge.type=="distance").sort((a, b) => (a.distancerequired > b.distancerequired) ? 1 : -1);
    const elevationBadges = badges.filter((badge=value) => badge.type=="elevation").sort((a, b) => (a.distancerequired > b.distancerequired) ? 1 : -1);

    return (
        <>
            <div className={styles.badges}>
                <div className={styles.badgeTitle}>Badges</div>
                <div className={styles.badgeGroup}>
                    <div className={styles.badgeGroupLabel}>Going the distance</div>
                    <div className={styles.badgeGroupLabel}>Climbing high</div>
                    <div className={styles.distanceBadgeGroup}>
                        {/* REMEMBER to replace key with badge id */}
                        {distanceBadges.map((badge=value) => {
                            const { id, title, description, distancerequired, imageurl } = badge;
                            const imageDisplayURL = imageurl ? imageurl : "https://stravadashboard.sirv.com/strava_summer_training_dashboard/badges/badge_placeholder.png";
                            const distanceProgress = `${Math.round((distance / distancerequired) * 10000) / 100}%  complete`
                            
                            return (<div className={`${styles.badge} ${styles.tooltipBadge}`} key={id}>
                                <Image
                                    src={imageDisplayURL}
                                    alt={`${title}`}
                                    layout="intrinsic"
                                    width={256}
                                    height={256}
                                />
                                <div className={styles.tooltipInfo}>
                                    <div className={styles.tooltipInfo__title}>{title}</div>
                                    <div className={styles.tooltipInfo__description}>{description}</div>
                                    <div className={styles.tooltipInfo__requirement}>{distanceProgress}</div>
                                </div>
                                <div className={styles.tooltipRequirement}>{Math.round(distancerequired / 1000).toLocaleString()}km</div>
                            </div>);
                        })}
                    </div>
                    <div className={styles.elevationBadgeGroup}>
                        {elevationBadges.map((badge=value, index=index) => {
                            const { id, title, description, distancerequired, imageurl } = badge;
                            const imageDisplayURL = imageurl ? imageurl : "https://stravadashboard.sirv.com/strava_summer_training_dashboard/badges/badge_placeholder.png";
                            const elevationProgress = `${Math.round((elevGain / distancerequired) * 10000) / 100}%  complete`

                            return (<div className={`${styles.badge} ${styles.tooltipBadge}`} key={id}>
                                <Image
                                    src={imageDisplayURL}
                                    alt={`${title}`}
                                    layout="intrinsic"
                                    width={256}
                                    height={256}
                                />
                                <div className={styles.tooltipInfo}>
                                    <div className={styles.tooltipInfo__title}>{title}</div>
                                    <div className={styles.tooltipInfo__description}>{description}</div>
                                    <div className={styles.tooltipInfo__requirement}>{elevationProgress}</div>
                                </div>
                                <div className={styles.tooltipRequirement}>{Math.round(distancerequired).toLocaleString()}m</div>
                            </div>);
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Clubs(props) {
    if (props.errorCode) {
        return (<ClubNotFound />);
    }
    
    const [id, setId] = useState();
    const [clubName, setClubName] = useState("");

    useEffect(() => {
        setId(getCookie('athleteId'));
        setClubName(` - ${props.clubInfo.name}`);
    }, []);

    return (
        <>
            <title>Dashboard {clubName}</title>
            <div className='loggedin'>
                <LoggedIn />
                <nav>
                    <Link href="/">
                        <a>Back to home</a>
                    </Link>
                    <Link href={`/athletes/${id}`}>
                        <a>User Profile</a>
                    </Link>
                </nav>
            </div>
            <div className='content'>
                <ClubHeader clubInfo={props.clubInfo}/>
                <div className={styles.statBorder}>
                    <h2>Leaderboard Placeholder</h2>
                    <ClubStats stats={props.stats} badgeCount={props.badges.length} />
                </div>
                <Badges stats={props.stats} badges={props.badges} />
                {/* <ListActivities activities={props.activities} /> */}
            </div>
        </>
    )
}