import { useEffect } from "react";
import Router, { useRouter } from "next/router";
import Tokens from "./api/tokens";
import useSWR from "swr";
import Link from 'next/link';

export async function getServerSideProps(ctx) {
    const requiredScopes = "read,activity:read_all";
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
    if (props.response) {
        return (<Error response={props.response}/>);
    } else {
        
    }
}

export default function LoginPage(props) {
    return (
        <LoggedIn props={props}/>
    )
}