import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import Home from "./pages/home";

const Router = () => (
    <BrowserRouter>
        <Switch>
            <Route exact path="/" component={Home}/>
        </Switch>
    </BrowserRouter>
)

export default Router;