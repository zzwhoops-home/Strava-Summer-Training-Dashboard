import clientPromise from "../../lib/mongodb";

export async function Calculation() {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteActivities = db.collection("athlete_activities");

    const athlete = await athleteActivities.findOne({ id: 31849223 });
    const activity = await athlete.activities[1];
    console.log(activity);

    const { distance, elevGain, movingTime, elapsedTime, groupSize } = activity;

    // elevation PP = avg grade PP + total elevation gain PP 
    const avgGrade = (elevGain / distance) * 100;
    const elevationPP = Math.pow(((Math.log(avgGrade + 1)) * 69) + (elevGain * 0.35), 0.8);

    // running PP = distance PP * speed PP
    const avgPace = distance / movingTime;
    const speedPP = Math.pow(((avgPace - 2) * 1.3), 3) + 8;
    const distanceMulti = (3 * Math.log((distance + 3700) / 7272)) + 2;
    const runningPP = Math.pow(speedPP * distanceMulti, 1.05);

    const rawTotalPP = elevationPP + runningPP;

    // penalty for a lot of elapsed time, small bonus for little, MERatio = Moving time to elapsed time ratio
    const MERatio = movingTime / elapsedTime;
    const elapsedMulti = Math.max(0, (2 * Math.log(MERatio + 0.01)) + 1);

    // small bonus for running with others
    const groupBonus = Math.pow((groupSize * 3) - 3, 0.5);

    const totalPP = ((elevationPP + runningPP) * elapsedMulti) + groupBonus;

    console.log(`Elevation: ${elevationPP}\nRunning: ${runningPP}\nElapsed Multi: ${elapsedMulti}\nGroup Bonus: ${groupBonus}\nTotal: ${totalPP}`);
}