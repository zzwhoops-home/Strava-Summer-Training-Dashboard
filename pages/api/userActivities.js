import clientPromise from "../../lib/mongodb";

export default async function UserActivities(req, res) {
    if (req.method != 'POST') {
        return res.status(405).send({ message: "You may only send POST requests to this endpoint. "});
    }
    // query DB
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const userActivities = db.collection("user_activities");

    // body parameters
    const body = req.body;
    const athleteId = body.athleteId;
}