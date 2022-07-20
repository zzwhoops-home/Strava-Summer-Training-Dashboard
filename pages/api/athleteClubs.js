import { getCookie } from "cookies-next";
import clientPromise from "../../lib/mongodb";
import { GetAccessToken } from "./refreshTokens";

export async function GetClubs(athleteId) {
    // query DB, get athlete clubs collection reference
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteClubs = db.collection("athlete_clubs");
    
    // GET valid access token from API endpoint
    const accessRes = await GetAccessToken(athleteId);

    if (accessRes.errorCode) {
        return ({
            errorCode: accessRes.errorCode
        });
    }
    const accessToken = accessRes.valid_access_token;        
    
    // find existing entry
    const existing = await athleteClubs.findOne({ id: athleteId });
    // current epoch timestamp
    const curTime = Math.floor(Date.now() / 1000);

    // update if existing or two days have elapsed since last update
    if (!existing || ((existing.lastUpdated + 172800) < curTime)) {
        // get required data from Strava
        const clubsURL = `https://www.strava.com/api/v3/athlete/clubs?access_token=${accessToken}`;
        const clubsResponse = await fetch(clubsURL);
        const clubsResponseJSON = await clubsResponse.json();
        
        // update DB with new clubs, if user doesn't exist create a new entry.
        const clubsDBFilter = {
            id: athleteId
        }
        const clubsDBData = {
            $set: {
                id: athleteId,
                lastUpdated: curTime,
                clubs: clubsResponseJSON
            }
        }
        await athleteClubs.findOneAndUpdate(clubsDBFilter, clubsDBData, { upsert: true });

        // return to populate page with data
        return clubsResponseJSON;
    } else {
        return existing.clubs;
    }

}
export default async function UserClubs(req, res) {

}