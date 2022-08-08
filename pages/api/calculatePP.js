import clientPromise from "../../lib/mongodb";
import { UpdateActivities } from "./athleteActivities";

export async function PerformanceCalculation(athleteId, accessToken) {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteActivities = db.collection("athlete_activities");

    let updates = [];

    let performances = [];

    const CalculatePP = async (activity) => {
        const { activityId, distance, elevGain, movingTime, elapsedTime, groupSize } = activity;
    
        // elevation PP = avg grade PP + total elevation gain PP 
        const avgGrade = (elevGain / distance) * 100;
        const elevationPP = Math.pow(((Math.log(avgGrade + 1)) * 69) + (elevGain * 0.35), 0.8);
    
        // running PP = distance PP * speed PP
        const avgPace = distance / movingTime;
        const speedPP = Math.pow(((avgPace - 2) * 1.3), 3) + 8;
        const distanceMulti = (3 * Math.log((distance + 3700) / 7272)) + 2;
        const runningPP = Math.pow(speedPP * distanceMulti, 1.05);
    
        const rawPP = elevationPP + runningPP;
    
        // penalty for a lot of elapsed time, small bonus for little, MERatio = Moving time to elapsed time ratio
        const MERatio = movingTime / elapsedTime;
        const elapsedMulti = Math.max(0, (2 * Math.log(MERatio + 0.01)) + 1);
    
        // small bonus for running with others
        const groupBonus = Math.pow((groupSize * 3) - 3, 0.5);
    
        // group bonus is separate from elapsed multiplier
        const totalPP = ((elevationPP + runningPP) * elapsedMulti) + groupBonus;

        // add totalPP only to calculate weighted PP
        performances.push(totalPP);
    
        const activityPerformance = {
            elevationPP: elevationPP,
            speedPP: speedPP,
            distanceMulti: distanceMulti,
            runningPP: runningPP,
            rawPP: rawPP,
            MERatio: MERatio,
            elapsedMulti: elapsedMulti,
            groupBonus: groupBonus,
            totalPP: totalPP
        }
        // match if activity performance breakdown doesn't exist yet
        const updateFilter = {
            "id": athleteId,
            "activities.activityId": activityId,
            "activities.$.activityPerformance": { "$exists": false }
        }
        const updateData = {
            $set: {
                "activities.$.activityPerformance": activityPerformance
            }
        }
        const update = {
            updateOne: {
                "filter": updateFilter,
                "update": updateData,
                "upsert": true
            }
        }
        updates.push(update);
    }

    const activities = await UpdateActivities(athleteId, accessToken);
    await activities.forEach(CalculatePP);
    await athleteActivities.bulkWrite(updates);

    // calculate performances using weighting, decreasing by 0.95^run index each time to encourage better runs
    await performances.sort((a, b) => (a < b) ? 1 : -1);
    const formattedPerformances = await performances.slice(0, 25);

    let weightedPerformance = 0.0;
    for (let i = 0; i < formattedPerformances.length; i++) {
        let mult = Math.pow(0.95, i);
        let curValue = formattedPerformances[i] * mult;
        weightedPerformance += curValue;
    }

    const athletePerformance = await Math.round(weightedPerformance).toLocaleString();

    return athletePerformance;

    // // in case if we want to remove activity performance for reworks, recalculating, activity model changes, etc...
    // const removeFilter = {
    //     "id": athleteId,
    //     "activities": {
    //         "$elemMatch": {
    //             "activityPerformance": { "$exists": true }
    //         }
    //     }
    // }
    // const removeUnset = {
    //     $unset: {
    //         "activities.$[].activityPerformance": ""
    //     }
    // }
    // console.log(await athleteActivities.updateMany(removeFilter, removeUnset));
}