import clientPromise from "../../lib/mongodb";
import badges from "./badges.json";

export async function ImportBadges(update) {
    if (!update) { return; }
    // query DB and club data collection
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const badgeInfo = db.collection("badge_info");

    // remove DB data first
    await badgeInfo.drop();
    
    const badgeData = await badges.map((value=value) => value);
    await badgeInfo.insertMany(badgeData);
}