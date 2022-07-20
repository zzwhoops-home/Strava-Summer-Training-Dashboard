import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';
import { GetClubActivities } from '../api/athleteClubs';

export async function getServerSideProps(req, res) {
    const clubId = await parseInt(req.query.id);
    const athleteId = await parseInt(req.req.cookies.athleteId);
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const clubData = db.collection("club_data");

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

    const getData = async (url) => {
        const response = await fetch(url);
        return await response.json();
    }

    // see if club exists
    var clubName;

    const updateClubData = async () => {
        const existing = await clubData.findOne({ id: clubId });
        const curTime = Math.floor(Date.now() / 1000);

        if (!existing) {
            // get club name if club data does not exist yet
            const clubURL = `https://www.strava.com/api/v3/clubs/${clubId}?access_token=${accessToken}`;
            const clubResponse = await getData(clubURL);

            const clubDBFilter = {
                id: clubId
            }
            const clubDBData = {
                $set: {
                    id: clubId,
                    name: clubResponse.name,
                    memberCount: clubResponse.member_count,
                    lastUpdated: curTime
                },
                $addToSet: {
                    registeredUsers: athleteId
                }
            }
            await clubData.findOneAndUpdate(clubDBFilter, clubDBData, { upsert: true });
            clubName = clubResponse.name;
        } else {            
            // otherwise just add the user to the list of users that have logged into our application
            const clubDBFilter = {
                id: clubId
            }
            const clubDBData = {
                $addToSet: {
                    registeredUsers: athleteId
                }
            }
            await clubData.findOneAndUpdate(clubDBFilter, clubDBData, { upsert: true });
            clubName = existing.name;
        }
    }


    // reversing to ensure that the newest activities are first
    await updateClubData();
    const activities = await GetClubActivities(clubId);

    return ({
        props: {
            clubName: clubName,
            activities: activities
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
                <GetStats />
            </div>
        </>
    )
}