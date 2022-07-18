import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import Error from 'next/error';
import UserNotFound from './user404';
import { getCookie } from 'cookies-next';
import LoggedIn from '../../components/loggedIn';
import { GetClubs } from '../api/userClubs';

export async function getServerSideProps(req, res) {
    const loggedInAthleteId = await parseInt(req.req.cookies.athleteId);
    const athleteId = await parseInt(req.query.id)
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const athleteInfo = db.collection("athlete_info");
    
    const clubs = await GetClubs(athleteId);

    if (clubs.errorCode) {
        return ({
            props: {
                errorCode: clubs.errorCode
            }
        })
    }
    
    // get athlete information
    const athlete = await athleteInfo.findOne({ id: athleteId });
    const athleteJSON = await JSON.parse(JSON.stringify(athlete));

    return ({
        props: {
            athlete: athleteJSON,
            clubs: clubs
        }
    });
}

function ListClubs({ clubs }) {
    return (
        <>
            <ol style={{listStyleType: "none"}}>
                {clubs.map((club=value) => (
                    <li key={club.id}>
                        <Link href={`${serverURL}/clubs/${club.id}`}>(Click here)</Link>
                        {` ${club.name}: ${club.member_count} members`}
                    </li>
                ))}
            </ol>
        </>
    )
}

export default function Users(props) {
    if (props.errorCode) {
        return (<UserNotFound />);
    }
    const athlete = props.athlete;

    const [id, setId] = useState();
    
    useEffect(() => {
        setId(getCookie('athleteId'))
    }, []);
    
    return (
        <>
            <LoggedIn id={id}/>
            <div className='header'>
                <h1>User: {`${athlete.first_name} ${athlete.last_name}`}</h1>
            </div>
            <Link href="/">
                <a>Back to home</a>
            </Link>
            <div className='clubs'>
                <ListClubs clubs={props.clubs}/>
            </div>

        </>
    );
}