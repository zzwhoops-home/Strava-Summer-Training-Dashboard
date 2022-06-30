import { useEffect } from "react";
import Router, { useRouter } from "next/router";
import Link from 'next/link';
import { requiredScopes } from "../config";

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
    return (<h>One moment, fetching your data...</h>)
}

export default function LoginPage(props) {
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
                const response = await fetch(`api/authorization?code=${props.data.code}&scope=${props.data.scope}`, {
                    method: 'GET',
                    "headers": headers
                });
                
            }
            authorize();
        }, []);

        return (
            <LoggedIn />
        );
    }
}