import clientPromise from '../../lib/mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverURL } from '../../config';

export async function getServerSideProps(req, res) {
    const id = req.query.id;
    const client = await clientPromise;

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    const props = await fetch(`${serverURL}/api/accessTokens?id=${id}`, {
        method: 'GET',
        headers: headers
    });
    const propsJSON = await props.json();

    return ({
        props: propsJSON
    });
}

// export async function getServerSideProps() {
//     const client = await clientPromise;
//     const db = client.db(process.env.DB);
//     const access_tokens = db.collection("access_tokens");

//     const query = {
//         id: id
//     }
//     const data = await access_tokens.find(query).toArray();

//     const aTokens = JSON.parse(JSON.stringify(data));

//     const filtered = aTokens.map(aToken => {
//         return {
//             _id: aToken._id,
//             name: aToken.name,
//             token: aToken.token
//         }
//     });

//     return {
//         props: {
//             aTokens: filtered
//         },
//     }

// }

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
                <h><b>User:</b> {JSON.stringify(props)}</h>
            </div>
            <Link href="/">
                <a>Back to home</a>
            </Link>
        </>
    );
}