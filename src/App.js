import React from 'react';
import history from "./history";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

import './App.css';
import DayView from './pages/DayView';
import MonthView from './pages/MonthView';
import EntryForm from './pages/EntryForm';
import Entries from './pages/Entries';
import Settings from './pages/Settings';
import Changes from './pages/Changes';
import Random from './pages/Random';
import Search from './pages/Search';
import TagView from './pages/TagView';
import ZIDView from './pages/ZIDView';
import OnThisDay from './pages/OnThisDay';
import PhotoDiary from './pages/PhotoDiary';
import NavBar from './components/NavBar';
import Uncategorized from './pages/Uncategorized';
import Incomplete from './pages/Incomplete';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { ThemeProvider, createMuiTheme, makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const routes = [
    { path: '/', name: 'Random', component: Random, exact: true },
    { path: '/photoEntries', name: 'With photos', component: PhotoDiary },
    { path: '/tag', name: 'Tag', component: TagView, routePath: '/tag/:tagParam?' },
    { path: '/zid', name: 'ZID', component: ZIDView, routePath: '/zid/:zidParam' },
    { path: '/day', name: 'Day', component: DayView, routePath: '/day/:dateParam?' },
    { path: '/month', name: 'Month', component: MonthView, routePath: '/month/:dateParam?' },
    { path: '/new', name: 'New', routePath: '/new/:dateParam?', component: EntryForm },
    { path: '/onthisday', name: 'On this day', routePath: '/onthisday/:dateParam?', component: OnThisDay },
    { path: '/uncategorized', name: 'Uncategorized', component: Uncategorized },
    { path: '/incomplete', name: 'Incomplete', component: Incomplete },
    { path: '/changes', name: 'Changes', component: Changes },
    { path: '/search', name: 'Search', component: Search },
    { path: '/entries', name: 'Entries', component: Entries, exact: true },
    { path: '/settings', name: 'Settings', component: Settings }
];

// theme = responsiveFontSizes(theme);

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: theme.spacing(1)
    },
    title: { flexGrow: 1, marginLeft: theme.spacing(2) },
    link: { marginRight: 10, padding: 5 }
}));

export default function App() {
    const classes = useStyles();
    const [themePreference, setThemePreference] = React.useState('dark');
    const theme = createMuiTheme({
        palette: {type: themePreference},
        typography: {
            body2: {
                fontSize: 20,
            }
        }
    });
    const toggleTheme = () => {
        if (themePreference === 'light') { setThemePreference('dark'); }
        else { setThemePreference('light'); }
    };
    return (<ThemeProvider theme={theme}>
              <CssBaseline/>
              <div className={classes.root}>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <Router history={history}>
                    <NavBar routes={routes} themePreference={themePreference} toggleTheme={toggleTheme} />
                    <Switch>
                      {routes.map((r, key) => {
                          if (r.exact) {
                              return <Route key={key} exact path={r.routePath || r.path} component={r.component}></Route>; 
                          } else {
                              return <Route key={key} path={r.routePath || r.path} component={r.component}></Route>;
                          }
                      })}
                      <Route path="/entries/:idParam" component={EntryForm} />
                    </Switch>
                  </Router>
                </MuiPickersUtilsProvider></div></ThemeProvider>
           );
}
