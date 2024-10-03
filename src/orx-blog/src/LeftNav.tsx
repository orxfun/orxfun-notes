import { PageMeta } from './App';
import { Link } from "react-router-dom";
import './LeftNav.css'

type LeftNavProps = {
    pageMetas: PageMeta[]
}

export const LeftNav = ({ pageMetas }: LeftNavProps) => {
    return (
        <>
            {
                pageMetas.map(x => {
                    return (
                        <div className='link'>
                            <Link key={x.path} to={x.path} title={x.summary}>{x.title}</Link>
                            <span className='date'>{x.date}</span>
                        </div>
                    )
                })
            }
        </>
    );
}
