export default async function Tokens(req, res) {
    const code = req.query.code;
    const scope = req.query.scope;
    
    const url = "https://www.strava.com/oauth/token";
    const response = await fetch(url, {
        method: 'post',
        "headers": headers,
        "body": body
    });
    const jsonRes = response.json();

    return res.status(200).json({
        token: "test"
    })
}