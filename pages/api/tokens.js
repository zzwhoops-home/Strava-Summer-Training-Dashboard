export default async function Tokens(req, res) {
    const url = `https://www.strava.com/oauth/token`;
    const response = await fetch(url);
    const jsonRes = response.json();
    
    return res.status(200).json({
        jsonRes
    })
}