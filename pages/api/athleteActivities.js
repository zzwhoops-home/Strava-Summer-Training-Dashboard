import clientPromise from "../../lib/mongodb";
import { GetAccessToken } from "./refreshTokens";

// format for storing activities:
// activity = {
//     athleteId: athleteId
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

// athleteId: number, accessToken: string
export async function UpdateActivities(athleteId, accessToken) {
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteActivities = db.collection("athlete_activities");
    const athleteInfo = db.collection("athlete_info");

    // find existing entry
    const existing = await athleteActivities.findOne({ id: athleteId });
    const athlete = await athleteInfo.findOne({ id: athleteId });
    // get current epoch timestamp
    const curTime = Math.floor(Date.now() / 1000);

    // create activities entry if it doesn't exist, or replace completely if the data is more than four hours old
    // return given page of activities (since limit is 200/page)
    const returnActivities = async (page, startTime) => {
        const activitiesURL = `https://www.strava.com/api/v3/athlete/activities?after=${startTime}&page=${page}&per_page=200&access_token=${accessToken}`;
        const res = await fetch(activitiesURL);
        const activitiesResponseJSON = await res.json();
        return activitiesResponseJSON;
    }
    // only try first 5 pages - 1000 activities
    const getActivities = async (startTime) => {
        let responses = [];
        
        for (let i = 1; i <= 10; i++) {
            const promise = await returnActivities(i, startTime);
            await responses.push(promise);
            // break if the array returned is empty, or under 200 entries to save requests
            console.log(promise.length);
            if (!(Array.isArray(promise) && promise.length) || promise.length < 200) {
                break;
            }
        }
        responses = await responses.flat();

        let formattedActivities = await responses.map((activity=value) => (
            {
                athleteId: athleteId,
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
        formattedActivities = await formattedActivities.reverse();
        return formattedActivities;
    }

    let activities = [];
    // logic if data is old or just doesn't exist
    if (!existing || ((existing.lastUpdated + 14400) < curTime)) {
        // 12AM EST 6/21/2022 (1655784000)
        const startTime = 1655784000
        activities = await getActivities(startTime);
    } else {
        // return database activities, don't query db or strava API
        return existing.activities;
    }

    // update DB with new clubs, if user doesn't exist create a new entry.
    const activitiesDBFilter = {
        id: athleteId,
    }
    const activitiesDBData = {
        $set: {
            id: athleteId,
            first_name: athlete.first_name,
            last_name: athlete.last_name,
            lastUpdated: curTime,
            activities: activities
        }
    }
    const activitiesDBArrayFilter = {
        upsert: true
    }
    await athleteActivities.findOneAndUpdate(activitiesDBFilter, activitiesDBData, activitiesDBArrayFilter);
}

// athleteIds: Array[number]
export async function MultiUpdateActivities(athleteIds) {
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteActivities = db.collection("athlete_activities");
    const athleteInfo = db.collection("athlete_info");

    // get current epoch timestamp
    const curTime = Math.floor(Date.now() / 1000);

    async function UpdateAthlete(athleteId) {
        // GET valid access token from API endpoint
        const accessRes = await GetAccessToken(athleteId);

        // skip rest of function if athlete doesn't exist
        if (accessRes.errorCode) {
            console.log("Athlete not found");
            return;
        }
        const accessToken = accessRes.valid_access_token;

        // find existing entry
        const existing = await athleteActivities.findOne({ id: athleteId });
        const athlete = await athleteInfo.findOne({ id: athleteId });

        // create activities entry if it doesn't exist, or replace completely if the data is more than four hours old
        // return given page of activities (since limit is 200/page)
        const returnActivities = async (page, startTime) => {
            const activitiesURL = `https://www.strava.com/api/v3/athlete/activities?after=${startTime}&page=${page}&per_page=200&access_token=${accessToken}`;
            const res = await fetch(activitiesURL);
            const activitiesResponseJSON = await res.json();
            return activitiesResponseJSON;
        }
        // only try first 5 pages - 1000 activities
        const getActivities = async (startTime) => {
            let responses = [];
            
            for (let i = 1; i <= 10; i++) {
                const promise = await returnActivities(i, startTime);
                await responses.push(promise);
                // break if the array returned is empty, or under 200 entries to save requests
                console.log(promise.length);
                if (!(Array.isArray(promise) && promise.length) || promise.length < 200) {
                    break;
                }
            }
            responses = await responses.flat();

            let formattedActivities = await responses.map((activity=value) => (
                {
                    athleteId: athleteId,
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
            formattedActivities = await formattedActivities.reverse();
            return formattedActivities;
        }

        let activities = [];
        // logic if data is old or just doesn't exist
        if (!existing || ((existing.lastUpdated + 14400) < curTime)) {
            // 12AM EST 6/21/2022 (1655784000)
            const startTime = 1655784000
            activities = await getActivities(startTime);
        } else {
            // return database activities, don't query db or strava API
            return existing.activities;
        }

        // update DB with new clubs, if user doesn't exist create a new entry.
        const activitiesDBFilter = {
            id: athleteId,
        }
        const activitiesDBData = {
            $set: {
                id: athleteId,
                first_name: athlete.first_name,
                last_name: athlete.last_name,
                lastUpdated: curTime,
                activities: activities
            }
        }
        const activitiesDBArrayFilter = {
            upsert: true
        }
        await athleteActivities.findOneAndUpdate(activitiesDBFilter, activitiesDBData, activitiesDBArrayFilter);
    }
    await athleteIds.forEach(UpdateAthlete);
}

export default async function AthleteActivities(req, res) {
    if (req.method == 'POST') {
        // body parameters
        const body = req.body;
        const athleteId = body.athleteId;
        
        // GET valid access token from API endpoint
        const accessRes = await GetAccessToken(athleteId);
    
        if (accessRes.errorCode) {
            return res.status(errorCode).send({ message: `Failed to get access token with error ${errorCode}` });
        }
        const accessToken = accessRes.valid_access_token;
    
        await UpdateActivities(athleteId, accessToken);

        return res.status(200).send({ message: "Data successfully updated" });
    } else if (req.method != 'GET') {

    } else {
        return res.status(405).send({ message: "You may only send GET and POST requests to this endpoint. "});
    }

}