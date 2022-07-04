import clientPromise from "../../lib/mongodb";
import { serverURL } from "../../config";

export default async function AccessTokens(req, res) {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const accessTokens = db.collection("access_tokens");
    const refreshTokens = db.collection("refresh_tokens");
    const athleteInfo = db.collection("athlete_info");

    // use ObjectId.getTimestamp() to get join date

    // POST requests should send a body in this format:
    // {
    //     athlete: athleteInfoFromStravaAPI,
    //     expires_at: whenAccessTokenExpires,
    //     access_token: accessToken,
    //     refresh_token: refreshToken,
    //     scope: true or false
    // }

    // POST method: body in format above, queries database to add a new user. Not used for updating entries.
    if (req.method == 'POST') {
        const authResponse = req.body;
        const athlete = authResponse.athlete;

        // match user ID
        const filter = {
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

        await accessTokens.findOneAndReplace(filter, accessTokenData, { upsert: true });
        await refreshTokens.findOneAndReplace(filter, refreshTokenData, { upsert: true })
        await athleteInfo.findOneAndReplace(filter, athleteData, { upsert: true });

        return res.status(200).send({ message: "Update probably successful" });
    } else {
        res.status(405).send({ message: "You may only GET or POST to this endpoint."} );
    }
}