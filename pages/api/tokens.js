export default async function Tokens(req, res) {
    const refreshToken = req.query.refreshToken;

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const body = JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    })
    
    const url = "https://www.strava.com/oauth/token";
    const response = await fetch(url, {
        method: 'post',
        "headers": headers,
        "body": body
    });
    const jsonRes = await response.json();

    return res.status(200).json({
        jsonRes
    })
}