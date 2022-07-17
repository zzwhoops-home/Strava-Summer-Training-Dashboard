import clientPromise from "../../lib/mongodb";
import { GetAccessToken } from "./refreshTokens";

async function UpdateActivities(athleteId, accessToken) {
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const userActivities = db.collection("user_activities");

    const existing = await userActivities.findOne({ id: athleteId });
    // 12AM EST 6/21/2022 (1655784000)
    const startTime = 1635784000
    const curTime = Math.floor(Date.now() / 1000);

    // create activities entry if it doesn't exist, or replace completely if the data is more than four hours old
    let activities = [];

    console.log(existing);

    if (!existing || (existing.lastUpdated + 14400) < curTime) {
        if (!existing) {
            const returnActivities = async (page) => {
                const activitiesURL = `https://www.strava.com/api/v3/athlete/activities?before=${curTime}&after=${startTime}&page=${page}&per_page=200&access_token=${accessToken}`;
                const res = await fetch(activitiesURL);
                const activitiesResponseJSON = await res.json();
                return activitiesResponseJSON;
            }

            // only try first 5 pages - 1000 activities
            for (let i = 1; i <= 5; i++) {
                const promise = await returnActivities(i);
                // break if the array returned is empty to save requests
                if (!(Array.isArray(promise) && promise.length)) {
                    break;
                }
                await activities.push(promise[0].pr_count);
            }
            await activities.flat();
        } else {

        }
        // get required data from Strava
        
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

        // await userActivities.findOneAndUpdate(activitiesDBFilter, activitiesDBData, { upsert: true });
    } else {
        return existing.activities;
    }
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