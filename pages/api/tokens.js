export default async function Tokens(req, res) {
    const url = ``;
    console.log(url);
    const response = await fetch(url);
    const jsonRes = response.json();
    
    return res.status(200).json({
        jsonRes
    })
}