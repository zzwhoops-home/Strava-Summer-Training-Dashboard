import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import UserNotFound from './user404';
import LoggedIn from '../../components/loggedIn';
import { GetClubs } from '../api/athleteClubs';
import styles from '../../styles/Users.module.css'
import { PerformanceCalculation } from '../api/calculatePP';
import { UpdateActivities } from '../api/athleteActivities';
import { GetAccessToken } from '../api/refreshTokens';

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

    const isUser = loggedInAthleteId == athleteId ? true : false;
    await PerformanceCalculation(athleteId, accessToken);

    return ({
        props: {
            athlete: athleteJSON,
            clubs: clubs,
            activities: activitiesJSON,
            isUser: isUser
        }
    });
}

function ListClubs({ clubs, isUser }) {
    // eventually we want to remove fitText for a table
    if (isUser) {
        return (
            <>
                <div className='fitText'>
                    <ol style={{listStyleType: "none"}}>
                        {clubs.map((club=value) => (
                            <li key={club.id}>
                                <Link href={`${serverURL}/clubs/${club.id}`}>(Click here)</Link>
                                {` ${club.name}: ${club.member_count} members`}
                            </li>
                        ))}
                    </ol>
                </div>
            </>
        );
    } else {
        return (
            <>
                <div className='fitText'>
                    <ol style={{listStyleType: "none"}}>
                        {clubs.map((club=value) => (
                            <li key={club.id}>
                                {` ${club.name}: ${club.member_count} members`}
                            </li>
                        ))}
                    </ol>
                </div>
            </>
        );
    }
}
function UserHeader({ athlete }) {
    const avatarURL = athlete.avatar_link ? athlete.avatar_link : "/strava_default_background.png";

    return (
        <div className={styles.title}>
            <div className={styles.name}>{`${athlete.first_name} ${athlete.last_name}`}</div>
            <div className={styles.titleImage} style={{backgroundImage: `url(${avatarURL})`}}></div>
        </div>
    );
}

function Activities() {

}

export default function Users(props) {
    if (props.errorCode) {
        return (<UserNotFound />);
    }
    const [name, setName] = useState("");

    useEffect(() => {
        setName(` - ${props.athlete.first_name} ${props.athlete.last_name}`);
    }, []);

    return (
        <>
            <title>User</title>
            <div className='loggedin'>
                <LoggedIn />
                <nav>
                    <Link href="/">
                        <a>Back to home</a>
                    </Link>
                </nav>
            </div>
            <div className='content'>
                <UserHeader athlete={props.athlete} />
                <Activities />
                <ListClubs clubs={props.clubs} isUser={props.isUser} />
            </div>
        </>
    );

}