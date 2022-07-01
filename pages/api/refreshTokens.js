import clientPromise from "../../lib/mongodb";
import { serverURL } from "../../config";

export default async function RefreshTokens(req, res) {
    const curTime = Math.floor(Date.now() / 1000);
    
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const accessTokens = db.collection("access_tokens");
    const refreshTokens = db.collection("refresh_tokens");
    const id = await req.query.id;
    
    // convert query string to number
    const query = {
        id: parseInt(id)
    }
    
    const response = await accessTokens.findOne(query);
    const responseJSON = await JSON.parse(JSON.stringify(response));
    console.log(responseJSON);

    if (curTime >= responseJSON.expires_at) {
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
    }
    


    return res.status(200).json({
        responseJSON
    });
}