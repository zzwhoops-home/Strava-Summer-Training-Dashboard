import clientPromise from "./lib/mongodb";
import Link from 'next/link';

export async function getServerSideProps() {
    const client = await clientPromise;
    const db = client.db(process.env.DB);
    const access_tokens = db.collection("access_tokens");

    const data = await access_tokens.find({}).toArray();

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
   
export default function DatabaseTest(aTokens) {
    return (
        <>
            <div>
                <Display aTokens={aTokens} />
            </div>
            <Link href="/">
                <a>Back to home</a>
            </Link>
        </>
    );
}