import { ReactNode } from 'react';

type PageProps = {
    top: ReactNode,
    article: ReactNode,
}

export const Page = ({ top, article }: PageProps) => {
    return (
        <div className='page'>
            {top}
            <div className='main'>
                <div></div>
                {article}
                <div></div>
            </div>
        </div>
    );
}
