import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';
import Error from 'next/error';
import UserNotFound from './user404';
import { getCookie } from 'cookies-next';
import LoggedIn from '../../components/loggedIn';
import { GetClubs } from '../api/athleteClubs';

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

    const isUser = loggedInAthleteId == athleteId ? true : false

    return ({
        props: {
            athlete: athleteJSON,
            clubs: clubs,
            isUser: isUser
        }
    });
}

function ListClubs({ clubs, isUser }) {
    // eventually we want to remove fitText for a table
    if (isUser) {
        return (
            <>
                <div className='fitText'>
                    <ol style={{listStyleType: "none"}}>
                        {clubs.map((club=value) => (
                            <li key={club.id}>
                                <Link href={`${serverURL}/clubs/${club.id}`}>(Click here)</Link>
                                {` ${club.name}: ${club.member_count} members`}
                            </li>
                        ))}
                    </ol>
                </div>
            </>
        );
    } else {
        return (
            <>
                <div className='fitText'>
                    <ol style={{listStyleType: "none"}}>
                        {clubs.map((club=value) => (
                            <li key={club.id}>
                                {` ${club.name}: ${club.member_count} members`}
                            </li>
                        ))}
                    </ol>
                </div>
            </>
        );
    }
}

export default function Users(props) {
    if (props.errorCode) {
        return (<UserNotFound />);
    }
    const athlete = props.athlete;

    return (
        <>
            <div className='content'>
                <LoggedIn />
                <h1>User: {`${athlete.first_name} ${athlete.last_name}`}</h1>
                <Link href="/">
                    <a>Back to home</a>
                </Link>
                <ListClubs clubs={props.clubs} isUser={props.isUser} />
            </div>
        </>
    );

}