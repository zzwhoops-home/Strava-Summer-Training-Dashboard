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

function Steps() {
    return (
        <>
            <Header title="Welcome!" />
            <ul style={{listStyleType: "none"}}>
                <li>(1). Register for a Strava account</li>
                <li>(2). Join any Strava club</li>
                <li>(3). Login to this application by clicking the "Connect with Strava" button below</li>
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
            <div className='loggedin'>
                <LoggedIn />
                <nav>
                    <Link href={`/athletes/${id}`} passHref>
                        <a>
                            View your clubs
                        </a>
                    </Link>
                </nav>
            </div>
        </>
    )
}

export default function HomePage() {
    return (
        <>
            <title>Strava Summer Training Dashboard</title>
            <ViewClubs />
            <div className='content'>
                <Header title="Strava Summer Dashboard" italic={true} />
                <Information />
                <Steps />
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
        </>
    )
}