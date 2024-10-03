import { PageMeta } from "../App"
import { Link } from "../articles/Link"
import { Link as RouteLink } from "react-router-dom";
import './Home.css';

type HomeProps = {
    articles: PageMeta[],
}

export const Home = ({ articles }: HomeProps) => {

    return (
        <div className='article home'>

            <h1 style={{ fontStyle: 'italic', fontWeight: 'normal' }}>
                notes about <Link text="orxfun" href="https://github.com/orxfun/" /> development
            </h1>

            <div className="articles-list">
                {
                    articles.map(x => {
                        return (
                            <div className='link'>
                                <RouteLink key={x.path} to={x.path} title={x.summary}>{x.title}</RouteLink>
                                <span className='date'>{x.date}</span>
                            </div>
                        )
                    })
                }

                <div className="end-space"></div>
            </div>

        </div>
    )
}
