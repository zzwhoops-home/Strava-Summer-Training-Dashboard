import clientPromise from "../../lib/mongodb";

export async function CalculateData() {
}
export async function GetStats(acts) {
    const activities = (await acts.map(value => value.activities))[0];
    // sum distance
    let stats = {
        activityCount: 0,
        distance: 0.0,
        elevGain: 0.0,
        elapsedTime: 0.0,
        movingTime: 0.0,
        kudos: 0,
        prs: 0
    }
    const calcDist = async (activity) => {
        stats.activityCount++;
        stats.distance += activity.distance;
        stats.elevGain += activity.elevGain;
        stats.elapsedTime += activity.elapsedTime;
        stats.movingTime += activity.movingTime;
        stats.kudos += activity.kudos;
        stats.prs += activity.prs;
    }
    activities.forEach(calcDist);
    
    return (stats);
}
export async function GetClubActivities(clubId) {    
    // query DB, get athlete clubs collection reference
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteActivities = db.collection("athlete_activities");
    const clubData = db.collection("club_data");

    // get current list of registered users for our club
    const currentClub = await clubData.findOne({ id: clubId });
    const registeredUsers = currentClub.registeredUsers;
    
    // return massive array of user data
    let userData = [];
    const activityArrayQuery = {
        id: {
            $in: registeredUsers
        }
    }
    const activityArrayOptions = {
        projection: {
            _id: 0
        }
    }
    const activityArrayCursor = await athleteActivities.find(activityArrayQuery, activityArrayOptions);
    const activityArray = await activityArrayCursor.toArray();
    return activityArray;
}