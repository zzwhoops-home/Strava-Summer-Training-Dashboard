import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useTable } from 'react-table';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import UserNotFound from './user404';
import LoggedIn from '../../components/loggedIn';
import { GetClubs } from '../api/athleteClubs';
import styles from '../../styles/Athletes.module.css'
import { PerformanceCalculation } from '../api/calculatePP';
import { GetAthleteStats, UpdateActivities } from '../api/athleteActivities';
import { GetAccessToken } from '../api/refreshTokens';
import AthleteTable from '../../components/performanceTable/tables';

export async function getServerSideProps(req, res) {
    const loggedInAthleteId = await parseInt(req.req.cookies.athleteId);
    const athleteId = await parseInt(req.query.id)
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteInfo = db.collection("athlete_info");

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
    
    const clubs = await GetClubs(athleteId);
    const activities = await UpdateActivities(athleteId, accessToken);
    const activitiesJSON = await JSON.parse(JSON.stringify(activities));

    if (clubs.errorCode) {
        return ({
            props: {
                errorCode: clubs.errorCode
            }
        });
    }
    
    // get athlete information
    const athlete = await athleteInfo.findOne({ id: athleteId });
    const athleteJSON = await JSON.parse(JSON.stringify(athlete));

    const isAthlete = loggedInAthleteId == athleteId ? true : false;
    const stats = await GetAthleteStats(athleteId, activitiesJSON)
    const performance = await PerformanceCalculation(athleteId, accessToken);

    return ({
        props: {
            athlete: athleteJSON,
            clubs: clubs,
            activities: activitiesJSON,
            stats: stats,
            performance: performance,
            isAthlete: isAthlete
        }
    });
}

function ClubsList({ clubs, isAthlete }) {

}

function ListClubs({ clubs, isAthlete }) {
    // eventually we want to remove fitText for a table
    if (isAthlete) {
        return (
            <>
                <div className={styles.clubs} id="clubs">
                    <div className={styles.sectionHeader}>
                        Athlete Clubs
                    </div>
                    <div className={styles.clubsList}>
                        <ol style={{listStyleType: "none"}}>
                            {clubs.map((club=value) => (
                                <li key={club.id}>
                                    <Link href={`${serverURL}/clubs/${club.id}`}>(Click here)</Link>
                                    {` ${club.name}: ${club.member_count} members`}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </>
        );
    } else {
        return (
            <>
                <div className={styles.clubs}>
                    <div className={styles.clubsTitle}>
                        Athlete Clubs
                    </div>
                    <div className={styles.clubsList}>
                        <ol style={{listStyleType: "none"}}>
                            {clubs.map((club=value) => (
                                <li key={club.id}>
                                    {` ${club.name}: ${club.member_count} members`}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </>
        );
    }
}

function AthleteHeader({ athlete }) {
    const avatarURL = athlete.avatar_link ? athlete.avatar_link : "/strava_default_background.png";

    return (
        <div className={styles.title}>
            <div className={styles.name}>{`${athlete.first_name} ${athlete.last_name}`}</div>
            <div className={styles.titleImage}>
                <img
                    src={avatarURL}
                    referrerpolicy="no-referrer"
                />
            </div>
        </div>
    );
}
function AthleteStats({ stats }) {
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
            <dl className={styles.athleteStats}>
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
            </dl>
        </>
    )
}
function AthleteOverview({ stats, performance }) {
    const description = "A formula which calculates a special score is a common feature in many rhythm games to determine how 'skillful' a performance is. Of course, giving a run a 'performance score' is difficult. It's impossible to factor in everything, from weather to the shoe you use. So, this feature is purely for fun, and only gives a rough estimate of how impressive a run is. It will be used for other purposes, like dealing damage to a running boss ;)";

    return (
        <div className={styles.overview} id="stats">
            <div className={styles.athletePerformance}>
                <div className={styles.performance}>
                    <div className={styles.score}>{performance}</div>
                    <div className={styles.label}>Performance Score</div>
                </div>
                <div className={`${styles.info} ${styles.tooltip}`}>
                    What does this mean?
                    <div className={styles.tooltipInfo}>{description}</div>
                </div>
            </div>
            <AthleteStats stats={stats}/>
        </div>
    );
}

function TopPerformances ({ activities }) {
    return (
        <div className={styles.topPerformances} id="performances">
            <div className={styles.sectionHeader}>Top Performances</div>
            <div className={styles.performanceTable}>
                <div className={styles.performanceTable__shadow}>
                    <AthleteTable activities={activities} />
                </div>
            </div>
        </div>
    );
}

export default function Athletes(props) {
    if (props.errorCode) {
        return (<UserNotFound />);
    }
    const [name, setName] = useState("");
    const [activities, setActivities] = useState();

    useEffect(() => {
        setName(` - ${props.athlete.first_name} ${props.athlete.last_name}`);
        setActivities(props.activities);
    }, []);

    return (
        <>
            <title>Athlete</title>
            <div className='loggedin'>
                <LoggedIn />
                <nav>
                    <Link href="/">
                        <a>Back to home</a>
                    </Link>
                </nav>
            </div>
            <div className='content'>
                {/* For future anchor navigation */}
                {/* <a href="#performances">Hi there</a> */}
                <AthleteHeader athlete={props.athlete} />
                <AthleteOverview stats={props.stats} performance={props.performance} />
                <ListClubs clubs={props.clubs} isAthlete={props.isAthlete} />
                <TopPerformances activities={props.activities} />
            </div>
        </>
    );

}