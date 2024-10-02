import { ReactNode } from 'react';

type PageProps = {
    leftNav: ReactNode,
    page: ReactNode,
}

export const Page = ({ leftNav, page }: PageProps) => {
    return (
        <div className='page'>
            <div className='left'>{leftNav}</div>
            <div className='main'>{page}</div>
        </div>
    );
}
