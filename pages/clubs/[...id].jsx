import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';

export async function getServerSideProps(req, res) {
    const clubId = await parseInt(req.query.id);
    const athleteId = await parseInt(req.req.cookies.athleteId);
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const clubActivities = db.collection("club_activities")
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

    const updateActivities = async () => {
        const existing = await clubData.findOne({ id: clubId });
        const curTime = Math.floor(Date.now() / 1000);

        if (!existing) {
            // get club name again - create api endpoint to add to db so we don't have to waste requests
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
            clubName = existing.name;
        }
        if (!existing || ((existing.lastUpdated + 86400) < curTime)) {
            // get required data from Strava
            const activitiesURL = `https://www.strava.com/api/v3/clubs/${clubId}/activities?page=1&per_page=200&access_token=${accessToken}`;
            const activitiesResponseJSON = await getData(activitiesURL);
            const reversedActivities = await activitiesResponseJSON.reverse();
            
            // update DB with new activities, if club doesn't exist create a new entry
            const activitiesDBFilter = {
                id: clubId
            }
            const activitiesDBData = {
                $set: {
                    id: clubId,
                    name: clubName,
                    lastUpdated: curTime
                },
                $addToSet: {
                    activities: {
                        $each: reversedActivities
                    }
                }
            }
            const updatedDB = await clubActivities.findOneAndUpdate(activitiesDBFilter, activitiesDBData, { upsert: true, returnDocument: "after" });
            const updatedActivities = await updatedDB.value.activities;

            // return to populate page with data
            return updatedActivities;
        } else {
            return existing.activities;
        }
    }

    // reversing to ensure that the newest activities are first
    const activities = (await updateActivities()).reverse();

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
            <Link href="/">
                <a>Back to home</a>
            </Link>
            <h1>Total Distance: {`${dist.toLocaleString()}m`}</h1>
            <div className='activities'>
                <ListActivities activities={activities}/>
            </div>

        </>
    );
}