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

    
    // return res.status(200).json({
    //     authResponseJSON
    // });
    
    // authResponseJSON.athlete.id

    const bodyDB = JSON.stringify({
        athlete: authResponseJSON.athlete,
        expires_at: authResponseJSON.expires_at,
        access_token: authResponseJSON.access_token,
        refresh_token: authResponseJSON.refresh_token,
        scope: (requiredScopes == scope) ? true : false
    });
    console.log(bodyDB);

    const responseDB = await fetch(`${serverURL}/api/accessEntries`, {
        method: 'POST',
        headers: headers,
        body: bodyDB
    });
    const responseDBJSON = await responseDB.json();
    console.log(responseDBJSON);

    return res.status(200).json({
        responseDBJSON
    });

    // check if the response is bad request. if not, query DB
    if (jsonRes.message == "Bad Request") {
        return res.status(400).json({
            message: "Please try authorization again."
        });
    } else {
        // query DB

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
        // access token parameters
        const body = {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken // change to whatever refreshtoken actually is
        }
        
        const url = "https://www.strava.com/oauth/token";
        const response = await fetch(url, {
            method: 'POST',
            "headers": headers,
            "body": body
        });
        const jsonRes = await response.json();


        return res.status(200).json({
            jsonRes
        });
    }

}