import { profile } from "console";
import { access } from "fs";
import clientPromise from "../../lib/mongodb";

export default async function AccessEntries(req, res) {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const accessTokens = db.collection("access_tokens");
    const refreshTokens = db.collection("refresh_tokens");
    const athleteInfo = db.collection("athlete_info");

    // use ObjectId.getTimestamp() to get join date

    // switch bad
    if (req.method == 'GET') {

    } else if (req.method == 'POST') {
        const authResponse = req.body;
        const athlete = authResponse.athlete;

        // match user ID
        const query = {
            id: athlete.id
        }

        const accessTokenData = {
            id: athlete.id,
            access_token: authResponse.access_token,
            expires_at: authResponse.expires_at,
            scope: authResponse.scope
        }
        const refreshTokenData = {
            id: athlete.id,
            refresh_token: authResponse.refresh_token,
            scope: authResponse.scope
        }
        const athleteData = {
            id: athlete.id,
            username: athlete.username,
            first_name: athlete.firstname,
            last_name: athlete.lastname,
            city: athlete.city,
            state: athlete.state,
            country: athlete.country,
            sex: athlete.sex,
            avatar_link: athlete.profile
        }

        await accessTokens.findOneAndReplace(query, accessTokenData, { upsert: true });
        await refreshTokens.findOneAndReplace(query, refreshTokenData, { upsert: true })
        await athleteInfo.findOneAndReplace(query, athleteData, { upsert: true });

        return res.status(200).send({ message: "Update probably successful" });
    } else {
        res.status(405).send({ message: "You may only GET or POST to this endpoint."} );
    }
}