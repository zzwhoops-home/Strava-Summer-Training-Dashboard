import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';

export async function getServerSideProps(req, res) {
    const id = req.query.id;
    const client = await clientPromise;
    const db = client.db(process.env.DB);

    // get valid access token from API endpoint
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const accessResponse = await fetch(`${serverURL}/api/accessTokens?id=${id}`, {
        method: 'GET',
        headers: headers
    });
    const accessResponseJSON = await accessResponse.json();
    const accessToken = accessResponseJSON.access_token;
    
    // return required data as props to populate page with
    const query = {
        id: id
    }
    const data = await access_tokens.find(query).toArray();
    
    const aTokens = JSON.parse(JSON.stringify(data));
    
    const filtered = aTokens.map(aToken => {
        return {
            _id: aToken._id,
            name: aToken.name,
            token: aToken.token
        }
    });
    
    return {
        props: {
            aTokens: filtered
        },
    }

    return ({
        props: propsJSON
    });
}


function Display({ aTokens }) {
    aTokens = aTokens["aTokens"][0];
    return (
        <div>
            <h2>{aTokens.name}</h2>
            <p>{aTokens.token}</p>
            <p>{aTokens._id}</p>
        </div>
    )
}

    /*
    const data = await access_tokens.find({}).toArray();
    console.log(data);
    */
   
export default function User(props) {
    return (
        <>
            <div>
                <h1><b>User:</b> {JSON.stringify(props)}</h1>
            </div>
            <Link href="/">
                <a>Back to home</a>
            </Link>
        </>
    );
}