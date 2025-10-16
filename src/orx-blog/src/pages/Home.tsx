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

            <h1 style={{ fontStyle: 'italic', fontWeight: 'normal', width: '100%' }}>
                notes about <Link text="orxfun" href="https://github.com/orxfun/" /> development
            </h1>

            <div className="article-list">
                {
                    articles.map(x => {
                        return (
                            <div className="article-list-item">
                                <div>{x.date}</div>
                                <div className="article-list-definition">
                                    <RouteLink to={x.path} title={x.summary}>{x.title}</RouteLink>
                                    <p className="article-summary">{x.summary}</p>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

        </div>
    )
}
