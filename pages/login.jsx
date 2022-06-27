import { useEffect } from "react";
import Router, { useRouter } from "next/router";
import Tokens from "./api/tokens";

function LoggedIn() {
    const routerQuery = useRouter().query;

    if (routerQuery["error"]) {
        return "Please authorize your Strava account in order to use this website.";
    } else {
        return routerQuery["code"];
    }
}

export default function LoginPage() {
    return (
        <LoggedIn />
    )
}