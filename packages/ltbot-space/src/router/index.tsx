import { createBrowserRouter, RouteObject } from 'react-router-dom'
import App from '../App'
import Home from '../pages/Home'
import Counter from '../pages/Counter'
import Canvas from '../pages/Canvas'
import NotFound from '../pages/NotFound'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'counter',
        element: <Counter />,
      },
      {
        path: 'canvas',
        element: <Canvas />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)

