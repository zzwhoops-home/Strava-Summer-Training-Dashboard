export default function LoggedIn({ id }) {
    if (id) {
        return (<p><i>{`Logged in as user with ID: ${id}`}</i></p>)
    } else { return (<p><i>Not logged in</i></p>)}
}