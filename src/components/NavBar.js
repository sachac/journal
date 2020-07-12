import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import CasinoIcon from '@material-ui/icons/Casino';
import SettingsIcon from '@material-ui/icons/Settings';
import Brightness3Icon from '@material-ui/icons/Brightness3';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { Link } from "react-router-dom";
import Drawer from '@material-ui/core/Drawer';

const useStyles = makeStyles(theme => ({
    title: { flexGrow: 1, marginLeft: theme.spacing(2) },
    link: { marginRight: 10, padding: 5, color: 'inherit' }
}));

export default function NavBar(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const classes = useStyles();
  const handleMenu = event => { setAnchorEl(event.currentTarget); };
  const handleClose = () => { setAnchorEl(null); };

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <IconButton onClick={handleMenu} edge="start" className={classes.menuButton} color="inherit" 
                    aria-controls="menu-appbar" aria-haspopup="true" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          <Link  style={{ textDecoration: 'inherit', color: 'inherit' }} to="/day">
            My journal
          </Link>
        </Typography>
        <IconButton tooltip="Random" color="inherit" className={classes.randomButton} component={Link} to="/"><CasinoIcon/></IconButton>
        <IconButton tooltip="Settings" color="inherit" className={classes.settingsButton} component={Link} to="/settings"><SettingsIcon/></IconButton>
        <IconButton tooltip="Night mode" color="inherit" onClick={props.toggleTheme}>
          {(props.themePreference === 'dark') ? <Brightness3Icon/> : <WbSunnyIcon/>}</IconButton>
        <IconButton tooltip="Search" color="inherit" component={Link} to="/search"><SearchIcon/></IconButton>
        <IconButton tooltip="New" color="inherit" component={Link} to="/new"><AddIcon/></IconButton>
      </Toolbar>
      <Drawer open={open} onClose={handleClose}>
        {props.routes.map((r, key) =>
          <Link className={classes.link} key={key} onClick={handleClose} to={r.path}>{r.name}</Link>)}
      </Drawer>
    </AppBar>
  );
}

