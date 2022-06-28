import clientPromise from "../lib/mongodb";

export default async function AccessEntries(req, res) {
    const client = await clientPromise;
    const db = client.db("dashboard_db");
    const access_tokens = db.collection("access_tokens");

    

}