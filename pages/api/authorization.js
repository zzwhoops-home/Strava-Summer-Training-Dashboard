import { setCookie } from "cookies-next";
import { serverURL } from "../../config";
import { requiredScopes } from "../../config";

export default async function Authorization(req, res) {
    const code = req.query.code;
    const scope = req.query.scope;

    // headers for everything below
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const authBody = JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
    })
    
    const authURL = "https://www.strava.com/oauth/token";
    const authResponse = await fetch(authURL, {
        method: 'POST',
        headers: headers,
        body: authBody
    });
    const authResponseJSON = await authResponse.json();

    // check if the response is bad request. if not, query DB
    if (authResponseJSON.message == "Bad Request") {
        return res.status(400).json({
            message: "Code expired, try authorization again."
        });
    }

    const bodyAccessDB = JSON.stringify({
        athlete: authResponseJSON.athlete,
        expires_at: authResponseJSON.expires_at,
        access_token: authResponseJSON.access_token,
        refresh_token: authResponseJSON.refresh_token,
        scope: (requiredScopes == scope) ? true : false
    });

    // POST to api endpoint to add user access tokens to database
    await fetch(`${serverURL}/api/accessTokens`, {
        method: 'POST',
        headers: headers,
        body: bodyAccessDB
    });

    const athleteId = authResponseJSON.athlete.id;

    // set cookie on webpage
    await setCookie('athleteId', athleteId, { req, res });

    const bodyActivityDB = JSON.stringify({
        athleteId: athleteId
    });

    // POST to api endpoint to add athlete activities to database
    await fetch(`${serverURL}/api/userActivities`, {
        method: 'POST',
        headers: headers,
        body: bodyActivityDB
    })

    return res.status(200).json({
        message: `${athleteId}'s data has been updated.`
    });
}