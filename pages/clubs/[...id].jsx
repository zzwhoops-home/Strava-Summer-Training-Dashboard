import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import ClubNotFound from './club404';
import { getCookie } from 'cookies-next';
import { GetAccessToken } from '../api/refreshTokens';
import { GetClubActivities, GetStats, UpdateClubData } from '../api/clubData';

export async function getServerSideProps(req, res) {
    const clubId = await parseInt(req.query.id);
    const athleteId = await parseInt(req.req.cookies.athleteId);

    // const clubDBData = {
    //     clubId: clubId,
    //     users: Array[athleteIds],
    //     memberCount: member_count
    // }

    // GET valid access token from API endpoint
    const accessRes = await GetAccessToken(athleteId);
    if (accessRes.errorCode) {
        return ({
            props: {
                errorCode: accessRes.errorCode
            }
        })
    }
    const accessToken = accessRes.valid_access_token;

    // reversing to ensure that the newest activities are first
    const clubName = await UpdateClubData(clubId, athleteId, accessToken);
    const activities = await GetClubActivities(clubId);
    const stats = await GetStats(activities);

    return ({
        props: {
            clubName: clubName,
            activities: activities,
            stats: stats
        }
    });
}

function ListActivities({ activities }) {
    console.log(activities);

    return (
        <>
            <ol style={{listStyleType: "none"}}>

            </ol>
        </>
    )
}

export default function Clubs(props) {
    if (props.errorCode) {
        return (<ClubNotFound />);
    }
    return (
        <>
            <div className='header'>
                <h1>Club: {`${props.clubName}`}</h1>
            </div>
            <div className='homePageLink'>
                <Link href="/">
                    <a>Back to home</a>
                </Link>
            </div>
            <div className='clubStats'>
                {/* <ListActivities activities={props.activities} /> */}
                <p>Distance: {(props.stats.distance).toLocaleString()}m</p>
                <p>{JSON.stringify(props.stats)}</p>
            </div>
            <ListActivities activities={props.activities} />
        </>
    )
}