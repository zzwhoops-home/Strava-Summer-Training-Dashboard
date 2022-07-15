import { update } from "mongodb-core/lib/wireprotocol";
import clientPromise from "../../lib/mongodb";

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
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const accessResponse = await fetch(`${serverURL}/api/refreshTokens?id=${athleteId}`, {
        method: 'GET',
        headers: headers
    });

    // check for errors
    const errorCode = accessResponse.ok ? false : accessResponse.status;
    if (errorCode) {
        return res.status(errorCode).send({ message: `Failed to get access token with error ${errorCode}` });
    }
    const accessResponseJSON = await accessResponse.json();
    const accessToken = accessResponseJSON.valid_access_token;

    const getData = async (url) => {
        const response = await fetch(url);
        return await response.json();
    }

    const existing = await userActivities.findOne({ id: athleteId });
    const curTime = Math.floor(Date.now() / 1000);

    const updateActivities = async () => {
        // create activities entry if it doesn't exist, or replace completely if the data is more than four hours old
        if (!existing || (existing.lastUpdated + 14400) < curTime) {
            // get required data from Strava
            const activitiesURL = `https://www.strava.com/api/v3/athlete/clubs?access_token=${accessToken}`;
            const activitiesResponseJSON = await getData(activitiesURL);
            
            // update DB with new clubs, if user doesn't exist create a new entry.
            const activitiesDBFilter = {
                id: athleteId
            }
            const activitiesDBData = {
                $set: {
                    id: athleteId,
                    lastUpdated: curTime,
                    activities: activitiesResponseJSON
                }
            }

            await userActivities.findOneAndUpdate(activitiesDBFilter, activitiesDBData, { upsert: true });
        } else {

        }
    }
    await updateActivities();
}