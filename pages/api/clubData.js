import clientPromise from "../../lib/mongodb";
import { UpdateActivities, MultiUpdateActivities } from "./athleteActivities";

export async function IsClubMember(clubId, athleteId) {
    // query DB and athlete club collection
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteClubs = db.collection("athlete_clubs");

    
    // make sure the athlete is part of the club before updating its data
    const clubQueryOptions = {
        projection: {
            "_id": 0,
            "clubs.id": 1
        }
    }
    const clubIdsQuery = await athleteClubs.findOne({ id: athleteId }, clubQueryOptions);
    const clubIds = await clubIdsQuery.clubs.map((id=value) => id.id);
    return clubIds.includes(clubId) ? true : false;
}
export async function GetClubStats(clubId, acts) {
    // query DB and club data collection
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const clubData = db.collection("club_data");

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

    // callback function for each activity
    async function SumStats(athleteData) {
        const activities = athleteData.activities;
        
        stats.activityCount += activities.length;

        const calcDist = async (activity) => {
            const { distance, elevGain, elapsedTime, movingTime, kudos, prs } = activity;
            stats.distance += distance;
            stats.elevGain += elevGain;
            stats.elapsedTime += elapsedTime;
            stats.movingTime += movingTime;
            stats.kudos += kudos;
            stats.prs += prs;
        }
        activities.forEach(calcDist);
    }
    
    await acts.forEach(SumStats);

    const clubDBFilter = {
        id: clubId
    }
    const clubDBData = {
        $set: {
            stats: stats
        }
    }   
    await clubData.updateOne(clubDBFilter, clubDBData, { upsert: true });

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
    // find all users in the list of registered users whose data needs to be updated
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
    const athleteClubs = db.collection("athlete_clubs");

    // try finding existing club data
    const existing = await clubData.findOne({ id: clubId });
    // get current epoch timestamp
    const curTime = Math.floor(Date.now() / 1000);
    
    // update if club doesn't exist or two days have elapsed since last update
    if (!existing || ((existing.lastUpdated + 172800) < curTime)) {
            
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
                profile: clubResponseJSON.profile,
                cover_photo: clubResponseJSON.cover_photo_small,
                url: clubResponseJSON.url,
                memberCount: clubResponseJSON.member_count,
                lastUpdated: curTime
            },
            $addToSet: {
                registeredUsers: athleteId
            }
        }
        const response = await clubData.findOneAndUpdate(clubDBFilter, clubDBData, { upsert: true, returnDocument: "after" });
        const responseJSON = await JSON.parse(JSON.stringify(response.value));
        return responseJSON;
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
        // this may cause potential problems if trying to get registered users through this function but data returned is old
        const existingJSON = JSON.parse(JSON.stringify(existing));
        return existingJSON;
    }
}

export async function GetBadges(clubId) {
    // query DB and club data collection
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const clubData = db.collection("club_data");
    const badgeInfo = db.collection("badge_info");

    const { stats } = await clubData.findOne({ id: clubId });
    const { distance, elevGain } = stats;

    const findBadges = async () => {
        const distanceBadgeQuery = {
            type: "distance",
            distancerequired: {
                $lte: distance
            }
        }
        const distanceBadgesCursor = await badgeInfo.find(distanceBadgeQuery);
        const distanceBadges = await distanceBadgesCursor.toArray();

        const elevationBadgeQuery = {
            type: "elevation",
            distancerequired: {
                $lte: elevGain
            }
        }
        const elevationBadgesCursor = await badgeInfo.find(elevationBadgeQuery);
        const elevationBadges = await elevationBadgesCursor.toArray();

        const allBadges = await ([...distanceBadges, ...elevationBadges]).flat();
        return JSON.parse(JSON.stringify(allBadges));
    }

    return await findBadges();
}