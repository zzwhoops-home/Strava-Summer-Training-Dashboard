import { useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <ul style={{listStyleType: "none"}}>
            {steps.map((step=value, index=index) => (
                <>
                    <ListItem key={index} value={`(${index + 1}). ${step}`} />
                    {/*<li key={index * 2}>{`${index + 1 * 2} Hi lol`}</li>*/}
                </>
            ))}
        </ul>
    )
}
function Purpose() {
    const reasons = ["Motivate each other through friendly competition", `Have fun beating up mascots from other schools`, "This was a lot of work"]

    return (
        <ul style={{listStyleType: "none"}}>
            {reasons.map((reason=value, index=index) => (
                <ListItem key={index} value={`(${index + 1}). ${reason}`} />
            ))}
        </ul>
    )
}

export default function HomePage() {
    return (
        <div>
            <Header title="Strava Summer Dashboard" italic={true} />
            <Header title="Welcome!" />
            <Steps toDisplay={4} />
            <Header title="So why sign up?" />
            <Purpose />
            <Link href={`https://www.strava.com/oauth/authorize?client_id=74853&response_type=code&redirect_uri=http://localhost:3000/login/&scope=activity:read_all`} passHref>
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