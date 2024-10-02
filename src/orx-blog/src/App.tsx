import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from './pages/Home';
import { Article } from './pages/Article';
import { ReactNode } from "react";
import { LeftNav } from "./LeftNav";
import './Page.css';
import { Page } from "./Page";
import { PageMetaImpVecMotivation } from "./articles/ImpVecMotivation";

export type PageMeta = {
  path: string,
  page: ReactNode,
  date: string,
  title: string,
  summary: string,
}

function App() {

  const pageMetas: PageMeta[] = [
    { path: '/', page: <Home />, title: 'home', date: '', summary: '' },
    PageMetaImpVecMotivation(),
    // { path: `/linked-list`, page: <Article />, title: 'LinkedList', date: '2025-01-01', summary: "about linked lists" },
  ];

  const leftNav = <LeftNav pageMetas={pageMetas} />;
  const pageOf = (page: ReactNode) => <Page leftNav={leftNav} page={page} />;

  return (
    <BrowserRouter>
      <Routes>
        {
          pageMetas.map((x, i) => {
            return (
              <Route key={i} path={x.path} element={pageOf(x.page)} />
            )
          })
        }
      </Routes>
    </BrowserRouter>
  );
}

export default App;
