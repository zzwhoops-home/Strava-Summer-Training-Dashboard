import Link from 'next/link';
import { requiredScopes } from "../config";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getCookie } from 'cookies-next';

export async function getServerSideProps(ctx) {
    // get url params
    const query = await ctx.query;
    let response = null;
    let data = null;

    if (query.error) {
        response = "Please authorize your Strava account in order to use this website.";
    } else if (query.scope != requiredScopes) {
        response = "You must authorize all scopes (do not uncheck the checkboxes on the authorization page).";
    } else {
        data = await query;
    }

    return {
        props: {
            response: response,
            data: data
        }
    }
}

function Error({ response }) {
    return (
        <>
            <div>
                <p>{response}</p>
                <Link href="/">
                    <a>
                        <h>Home page</h>
                    </a>
                </Link>
            </div>
        </>
    );
}

function LoggedIn({ props }) {
    return (<h1 style={{color: "white"}}>One moment, fetching your data...</h1>)
}

export default function LoginPage(props) {
    const router = useRouter();

    if (props.response) {
        return (
            <Error response={props.response}/>
        );
    } else {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
        useEffect(() => {
            const authorize = async () => { 
                await fetch(`api/authorization?code=${props.data.code}&scope=${props.data.scope}`, {
                    method: 'GET',
                    "headers": headers
                });
                const athleteId = await getCookie('athleteId');

                await router.push(`/users/${athleteId}`);
            }
            authorize();
        }, []);

        return (
            <LoggedIn />
        );
    }
}