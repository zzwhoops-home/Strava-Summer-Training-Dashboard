import clientPromise from "../../lib/mongodb";
import { GetAccessToken } from "./refreshTokens";

// format for storing activities:
// activity = {
//     activityId: id,
//     name: name,
//     distance: distance,
//     movingTime: moving_time,
//     elapsedTime: elapsed_time,
//     elevGain: total_elevation_gain,
//     elevHigh: elev_high,
//     elevLow: elev_low,
//     startDateLocal: start_date_local,
//     utcOffset: utc_offset,
//     startLatLng: start_latlng,
//     endLatLng: end_latlng,
//     city: location_city,
//     state: location_state,
//     country: location_country,
//     kudos: kudos_count,
//     groupSize: athlete_count,
//     map: map,
//     prs: pr_count
// }

async function UpdateActivities(athleteId, accessToken) {
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const userActivities = db.collection("user_activities");

    // find existing entry
    const existing = await userActivities.findOne({ id: athleteId });
    // get current epoch timestamp
    const curTime = Math.floor(Date.now() / 1000);

    // create activities entry if it doesn't exist, or replace completely if the data is more than four hours old
    let activities = [];

    // return given page of activities (since limit is 200/page)
    const returnActivities = async (page, startTime) => {
        const activitiesURL = `https://www.strava.com/api/v3/athlete/activities?before=${curTime}&after=${startTime}&page=${page}&per_page=200&access_token=${accessToken}`;
        const res = await fetch(activitiesURL);
        const activitiesResponseJSON = await res.json();
        return activitiesResponseJSON;
    }
    // only try first 5 pages - 1000 activities
    const getActivities = async (startTime) => { 
        for (let i = 1; i <= 5; i++) {
            const promise = await returnActivities(i, startTime);
            // break if the array returned is empty to save requests
            if (!(Array.isArray(promise) && promise.length)) {
                break;
            }
            await activities.push(promise);
        }
        activities = await(activities.flat());
        const formattedActivities = activities.map((activity=value) => (
            {
                activityId: activity.id,
                name: activity.name,
                distance: activity.distance,
                movingTime: activity.moving_time,
                elapsedTime: activity.elapsed_time,
                elevGain: activity.total_elevation_gain,
                elevHigh: activity.elev_high,
                elevLow: activity.elev_low,
                startDateLocal: activity.start_date_local,
                utcOffset: activity.utc_offset,
                startLatLng: activity.start_latlng,
                endLatLng: activity.end_latlng,
                city: activity.location_city,
                state: activity.location_state,
                country: activity.location_country,
                kudos: activity.kudos_count,
                groupSize: activity.athlete_count,
                map: activity.map,
                prs: activity.pr_count
            }
        ));
        return formattedActivities;
    }

    // logic if data is old or just doesn't exist
    if (!existing) {
        // 12AM EST 6/21/2022 (1655784000)
        const startTime = 1655784000
        await getActivities(startTime);
    } else if ((existing.lastUpdated + 86400) < curTime) {
        // get activities from last updated timestamp
        const startTime = existing.lastUpdated;
        await getActivities(startTime);
    } else {
        // return database activities, don't query db or strava API
        return existing.activities;
    }

    // update DB with new clubs, if user doesn't exist create a new entry.
    const activitiesDBFilter = {
        id: athleteId
    }
    const activitiesDBData = {
        $set: {
            id: athleteId,
            lastUpdated: curTime,
            activities: activities
        }
    }
    await userActivities.findOneAndUpdate(activitiesDBFilter, activitiesDBData, { upsert: true });
}

export default async function UserActivities(req, res) {
    if (req.method != 'POST') {
        return res.status(405).send({ message: "You may only send POST requests to this endpoint. "});
    }
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const userActivities = db.collection("user_activities");

    // body parameters
    const body = req.body;
    const athleteId = body.athleteId;
    
    // GET valid access token from API endpoint
    const accessRes = await GetAccessToken(athleteId);

    if (accessRes.errorCode) {
        return res.status(errorCode).send({ message: `Failed to get access token with error ${errorCode}` });
    }
    const accessToken = accessRes.valid_access_token;

    console.log(await UpdateActivities(athleteId, accessToken));

    return res.status(200).send({ message: "User activities sphog" });
}