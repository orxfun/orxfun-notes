import { PageMeta } from './App';
import './LeftNav.css'

type LeftNavProps = {
    pageMetas: PageMeta[]
}

export const LeftNav = ({ pageMetas }: LeftNavProps) => {
    return (
        <>
            {
                pageMetas.map((x, i) => {
                    return (
                        <div className='link'>
                            <a href={x.path} title={x.summary}>{x.title}</a>
                            <span className='date'>{x.date}</span>
                        </div>
                    )
                })
            }
        </>
    );
}
