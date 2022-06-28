export default async function Authorization(req, res) {
    const code = req.query.code;
    const scope = req.query.scope;

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const body = JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
    })
    
    const url = "https://www.strava.com/oauth/token";
    const response = await fetch(url, {
        method: 'POST',
        "headers": headers,
        "body": body
    });
    const jsonRes = await response.json();

    // check if the response is bad request. if not, query DB
    if (jsonRes.message == "Bad Request") {
        return res.status(400).json({
            message: "Please try authorization again."
        });
    } else {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
        // access token parameters
        const body = {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
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