import { Link } from "../articles/Link"

export const Home = () => {
    return (
        <div className='article'>
            <p className="side-note">
                A notebook about <Link text="orxfun" href="https://github.com/orxfun/" /> development.
            </p>
        </div>
    )
}
