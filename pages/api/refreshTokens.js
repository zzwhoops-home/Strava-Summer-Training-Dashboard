import clientPromise from "../../lib/mongodb";

export default async function RefreshTokens(req, res) {
    // GET requests should send a query in this format:
    // ...?id=athleteId
    // GET method: retrieve access token from database, if it is invalid, call API route to refresh it.
    if (req.method != 'GET') {
        return res.status(405).send({ message: "You may only send GET requests to this endpoint. "});
    }

    const curTime = Math.floor(Date.now() / 1000);
    let validAccessToken;

    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const accessTokens = db.collection("access_tokens");
    const refreshTokens = db.collection("refresh_tokens");
    
    // convert query string into number
    const id = await parseInt(req.query.id);
    var queryDB = {
        id: id
    }

    // see if access token exists. return 404 if it doesn't exist yet (id is not valid or user has not authorized it)
    const accessResponse = await accessTokens.findOne(queryDB);
    const accessResponseJSON = await JSON.parse(JSON.stringify(accessResponse));
    if (!accessResponse) {
        return res.status(404).send({ message: "An athlete with this ID was not found!" });
    }
    validAccessToken = accessResponseJSON.access_token;

    
    if (curTime >= accessResponseJSON.expires_at) {
        const refreshResponse = await refreshTokens.findOne(queryDB);
        const refreshResponseJSON = await JSON.parse(JSON.stringify(refreshResponse));

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
        // access token parameters
        const body = JSON.stringify({
            client_id: await parseInt(process.env.STRAVA_CLIENT_ID),
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshResponseJSON.refresh_token
        });
        
        const url = "https://www.strava.com/oauth/token";
        const newTokenResponse = await fetch(url, {
            method: 'POST',
            "headers": headers,
            "body": body
        });
        const newTokenResponseJSON = await newTokenResponse.json();

        if (!newTokenResponseJSON) {
            return res.status(404).send({
                message: "Error retrieving new access token from Strava."
            });  
        }

        const athleteId = accessResponseJSON.id;
        const newAccessToken = newTokenResponseJSON.access_token;
        const newExpiresAt = newTokenResponseJSON.expires_at;
        const newRefreshToken = newTokenResponseJSON.refresh_token;

        // may be a good idea to have a separate API endpoint that only uses findOneAndUpdate
        // match user ID
        const filter = {
            id: athleteId
        }

        const accessTokenData = {
            $set: {                    
                id: athleteId,
                access_token: newAccessToken,
                expires_at: newExpiresAt
            }
        }

        // be absolutely sure we're not replacing refresh tokens with null values
        if (newRefreshToken) {
            const refreshTokenData = {
                $set: {
                    id: athleteId,
                    refresh_token: newRefreshToken
                }
            }
            await refreshTokens.findOneAndUpdate(filter, refreshTokenData, { upsert: true });
        }
        await accessTokens.findOneAndUpdate(filter, accessTokenData, { upsert: true });
        
        // replace what we are returning with our new access token
        validAccessToken = newAccessToken;
    }

    return res.status(200).json({
        message: "Update successful",
        valid_access_token: validAccessToken
    });
}