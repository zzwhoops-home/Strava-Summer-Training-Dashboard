import { access } from "fs";
import clientPromise from "../../lib/mongodb";

export default async function AccessEntries(req, res) {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const accessTokens = db.collection("access_tokens");

    switch (req.method) {
        case 'GET':
            break;
        case 'POST':
            const body = req.body;

            // accessTokens.findOneAndReplace();
            console.log(body);
        default:
            res.status(405).send({ message: "You may only GET or POST to this endpoint."} );
    }
}