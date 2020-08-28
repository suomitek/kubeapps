import { routerMiddleware } from "connected-react-router";
import { createHashHistory } from "history";
import { applyMiddleware, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunkMiddleware from "redux-thunk";

import createRootReducer from "../reducers";

// Use Hash based routing to support deploying Suomitek-appboard in arbitrary URL subpaths
export const history = createHashHistory();

export default createStore(
  createRootReducer(history), // add router state to reducer
  composeWithDevTools(
    applyMiddleware(
      thunkMiddleware,
      routerMiddleware(history), // // for dispatching history actions
    ),
  ),
);
