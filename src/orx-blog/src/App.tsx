import { ReactNode } from "react";
import { Route, Routes } from 'react-router-dom';
import { PageMetaImpVecMotivation } from "./articles/ImpVecMotivation";
import { Home } from './pages/Home';
import './Page.css';
import { Top } from "./pages/Top";
import { Page } from "./Page";

export type PageMeta = {
  path: string,
  page: ReactNode,
  date: string,
  title: string,
  summary: string,
}

function App() {

  const articles: PageMeta[] = [
    PageMetaImpVecMotivation(),
  ];

  const top = <Top />;
  const pageOf = (article: ReactNode) => <Page top={top} article={article} />;

  const home = pageOf(<Home articles={articles} />);

  return (
    <div className="page">
      <Routes>
        <Route path="/" element={home} />
        {
          articles.map(x => {
            return (
              <Route key={x.path} path={x.path} element={pageOf(x.page)} />
            )
          })
        }
      </Routes>
    </div>
  );
}

export default App;
