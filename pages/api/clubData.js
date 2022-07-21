import clientPromise from "../../lib/mongodb";
import { UpdateActivities, MultiUpdateActivities } from "./athleteActivities";

export async function CalculateData() {
}
export async function GetStats(acts) {
    // object with sum of statistics
    let stats = {
        activityCount: 0,
        distance: 0.0,
        elevGain: 0.0,
        elapsedTime: 0.0,
        movingTime: 0.0,
        kudos: 0,
        prs: 0
    }

    async function SumStats(athleteData) {
        const activities = athleteData.activities;
        
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
    }
    
    await acts.forEach(SumStats);

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

    // find user activities that are more than two days old and bulk update them
    const curTime = Math.floor(Date.now() / 1000);
    const updateQuery = {
        id: {
            $in: registeredUsers
        },
        lastUpdated: {
            $lte: curTime - 172800
        }
    }
    const updateOptions = {
        projection: {
            _id: 0,
            activities: 0,
            lastUpdated: 0
        }
    }
    const oldDataCursor = await athleteActivities.find(updateQuery, updateOptions);
    const oldData = await oldDataCursor.toArray();
    let oldDataFormatted = await oldData.map((id=value) => id.id);

    await MultiUpdateActivities(oldDataFormatted);

    // return massive array of user data
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

    // console.log(await activityArray.map(value => value.id));
    return activityArray;
}

// function to store information on who has logged in with our application
export async function UpdateClubData(clubId, athleteId, accessToken) {
    // query DB and club data collection
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const clubData = db.collection("club_data");

    // try finding existing club data
    const existing = await clubData.findOne({ id: clubId });
    // get current epoch timestamp
    const curTime = Math.floor(Date.now() / 1000);

    let clubName;
    if (!existing) {
        // get club name if club data does not exist yet
        const clubURL = `https://www.strava.com/api/v3/clubs/${clubId}?access_token=${accessToken}`;
        const clubResponse = await fetch(clubURL);
        const clubResponseJSON = await clubResponse.json();

        const clubDBFilter = {
            id: clubId
        }
        const clubDBData = {
            $set: {
                id: clubId,
                name: clubResponseJSON.name,
                memberCount: clubResponseJSON.member_count,
                lastUpdated: curTime
            },
            $addToSet: {
                registeredUsers: athleteId
            }
        }
        await clubData.findOneAndUpdate(clubDBFilter, clubDBData, { upsert: true });
        clubName = clubResponseJSON.name;
    } else {            
        // otherwise just add the user to the list of users that have logged into our application
        const clubDBFilter = {
            id: clubId
        }
        const clubDBData = {
            $addToSet: {
                registeredUsers: athleteId
            }
        }
        await clubData.findOneAndUpdate(clubDBFilter, clubDBData, { upsert: true });
        clubName = existing.name;
    }
    // return to be used, may change to an object
    return clubName;
}