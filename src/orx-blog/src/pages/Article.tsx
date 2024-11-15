import { ReactNode } from 'react';
import './Article.css';

type ArticleProps = {
    content: ReactNode
}

export const Article = ({ content }: ArticleProps) => {
    return (
        <div className='article'>
            {content}
        </div>
    )
}
