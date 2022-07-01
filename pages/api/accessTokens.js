import clientPromise from "../../lib/mongodb";
import { serverURL } from "../../config";

export default async function AccessTokens(req, res) {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const accessTokens = db.collection("access_tokens");
    const refreshTokens = db.collection("refresh_tokens");
    const athleteInfo = db.collection("athlete_info");

    // use ObjectId.getTimestamp() to get join date


    // GET requests should send a query in this format:
    // ...?id=someId
    // POST requests should send a body in this format:
    // {
    //     athlete: athleteInfoFromStravaAPI,
    //     expires_at: whenAccessTokenExpires,
    //     access_token: accessToken,
    //     refresh_token: refreshToken,
    //     scope: true or false
    // }

    // GET method: retrieve access token from database, if it is invalid, call API route to refresh it.
    if (req.method == 'GET') {
        const id = req.query.id;

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        const accessURL = `${serverURL}/api/refreshTokens?id=${id}`;
        await fetch(accessURL, {
            method: 'GET',
            headers: headers
        });

        return res.status(200).json({
            message: "success?"
        });

    } 
    // POST method: body in format above, queries database to add a new user. Not used for updating entries.
    else if (req.method == 'POST') {
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