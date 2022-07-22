import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCookie } from "cookies-next";
import LoggedIn from "../components/loggedIn";
import { serverURL } from "../config";

function Header({ title, italic }) {
    return <h1><u>{italic ? <em>{title}</em> : title}</u></h1>;
}

function ListItem(props) {
    return <li>{props.value}</li>
}

function Steps({ toDisplay }) {
    let steps = ["Register for a Strava account", "Join the Princeton XC/TF Summer Training Club", "Login with your Strava account here", "View your club on this website!"]
    steps = steps.slice(0, toDisplay);
    
    return (
        <>
            <Header title="Welcome!" />
            <ul style={{listStyleType: "none"}}>
                {steps.map((step=value, index=index) => (
                    <>
                        <ListItem key={index} value={`(${index + 1}). ${step}`} />
                        {/*<li key={index * 2}>{`${index + 1 * 2} Hi lol`}</li>*/}
                    </>
                ))}
            </ul>
        </>
    )
}
function Purpose() {
    const reasons = ["Motivate each other through friendly competition", `Have fun beating up mascots from other schools`, "This was a lot of work"]

    return (
        <>
            <Header title="So why sign up?" />
            <ul style={{listStyleType: "none"}}>
                {reasons.map((reason=value, index=index) => (
                    <ListItem key={index} value={`(${index + 1}). ${reason}`} />
                    ))}
            </ul>
        </>
    )
}

function Information() {
    return(
        <>
            <Header title="General Information:" />
            <p>"Summer training" began on the Summer Solstice, 6/21/2022, and ends on 9/08/2022, Milesplit's official XC opening day!</p>
        </>
    )
}

function Disclaimer() {
    return (
        <>
            <Header title="Disclaimer:" />
            <p>Note that logging in will grant this application access to all of your activities and athlete data. This is to ensure that your information displays correctly. I will most likely not sell your data.</p>
            <p><i>Unfortunately, because of limitations with the Strava API, only the information of users who have logged into this application will be displayed.</i></p>
            <p><i>On your first login, only up to your most recent 1000 activities will be counted.</i></p>
        </>
    );
}

function ViewClubs() {
    const [id, setId] = useState();

    useEffect(() => {
        setId(getCookie('athleteId'));
    }, []);

    return (
        <>
            <nav>
                <LoggedIn />
                <Link href={`/users/${id}`} passHref>
                    <a>
                        View your clubs
                    </a>
                </Link>
            </nav>
        </>
    )
}

export default function HomePage() {
    return (
        <div className='content'>
            <ViewClubs />
            <Header title="Strava Summer Dashboard" italic={true} />
            <Information />
            <Steps toDisplay={4} />
            <Purpose />
            <Disclaimer />
            <Link href={`https://www.strava.com/oauth/authorize?client_id=74853&response_type=code&redirect_uri=${serverURL}/login/&scope=activity:read_all`} passHref>
                <a>
                    <Image
                        src="/strava_button_orange.png"
                        layout="intrinsic"
                        width={193}
                        height={48}
                        srcSet="2x"
                    />
                </a>
            </Link>
        </div>
    )
}