import React, { useState, useEffect } from 'react';
import history from "../history";
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import __ from 'lodash';
import { Link } from 'react-router-dom';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import Button from '@material-ui/core/Button';
import DateSelector from '../components/DateSelector';
import EntryTree from '../components/EntryTree';
import PhotoList from '../components/PhotoList';
import EntryList from '../components/EntryList';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import { useParams } from "react-router-dom";
import CategoryList from "../components/CategoryList";
import { debounce } from 'throttle-debounce';
import { objToQueryString } from '../App';

const useStyles = makeStyles(theme => ({
  note: { width: '100%' },
  [theme.breakpoints.down('sm')]: {
    root: {
      fontSize: 'large',
      '& .MuiInputBase-root': { fontSize: 'x-large' }
    }
  }
}));

function useEntryBehavior(props) {
  let entry = props.entry;
  let setEntry = props.setEntry;
  const splitEntry = async () => {
    let noteBodies = entry.Note.split(/\n+/);
    await noteBodies.reduce((prevPromise, cur) => {
      return prevPromise.then((_) => {
        return fetch('/api/entries', {
          method: 'POST',
          headers: {'Content-Type': 'application/json' },
          body: JSON.stringify({...entry, Note: cur})
        }).then((res) => res.json()).then((o) => {
          props.setMessage && props.setMessage(`Created ${o.ZIDString}: ${o.Note}`);
        });
      });
    }, Promise.resolve([])).then((res) => {
      setEntry({Note: '', Other: '', Category: '', Time: moment().format('HH:mm:ss'), Date: moment(entry.Date).format('YYYY-MM-DD')});
      if (props.onSubmit) { props.onSubmit(res); };
    });
  };
  const saveEntry = () => {
    if (entry.ID) {
      return fetch('/api/entries/' + entry.ID, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).then((res) => res.json())
        .then((res) => {
          setEntry(res);
          if (props.onSubmit) { props.onSubmit(res); }
        });
    } else {
      return fetch('/api/entries', {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).then((res) => {
        // After creating a new entry, clear the items and update the list of entries for the day
        setEntry({Note: '', Other: '', Category: '', Time: moment().format('HH:mm:ss'), Date: moment(entry.Date).format('YYYY-MM-DD')});
        if (props.onSubmit) { props.onSubmit(res); }
      });
    }
  };
  const deleteEntry = () => {
    if (entry.ID) {
      fetch('/api/entries/' + entry.ID, { method: 'DELETE' })
        .then(() => {
          if (props.onSubmit) { props.onSubmit(); }
        });
    }
  };
  const handleChange = event => {
    if (event.target.name === 'note') setEntry({...entry, Note: event.target.value});
    if (event.target.name === 'category') setEntry({...entry, Category: event.target.value});
    if (event.target.name === 'other') setEntry({...entry, Other: event.target.value});
    if (event.target.name === 'time') {
      setEntry({...entry,
                Time: event.target.value});
    }
  };
  const handleKey = event => {
    if (event.key === 'Enter' && event.ctrlKey) {
      saveEntry();
    }
  };
  return { handleKey, handleChange, saveEntry, deleteEntry, splitEntry };
}

export function QuickEntryForm(props) {
  const classes = useStyles();
  const [ entry, setEntry ] = useState(props.entry || {Category: '', Note: '', Other: '', Date: moment(props.date).toDate(), PictureList: props.selected});
  const [ message, setMessage ] = useState('');
  const onSubmit = function(res) {
    return Promise.resolve(props.onSubmit ? props.onSubmit(res) : res).then(function(res) {
      if (!entry.ID) {
        setEntry({Category: '', Note: '', Other: '', Date: moment(props.date).toDate(), PictureList: []});
      }
    });
  };
  const linkEntryWhileEditing = function(ref, linkTo) {
    if (linkTo && entry && !((entry.Other || '').match('ref:' + linkTo.ZIDString))) {
      setEntry({...entry, Other: entry.Other + "\nref:" + linkTo.ZIDString});
    }
  };
  const deselectPhoto = (e, p) => {
    setEntry({...entry, PictureList: (entry.PictureList || []).filter(d => d !== p)});
  };
  const { handleKey, saveEntry, splitEntry, deleteEntry, handleChange } = useEntryBehavior({entry, setEntry, setMessage, onSubmit: onSubmit});
  useEffect(() => { if (props.entry) setEntry(props.entry); }, [props.entry]);
  useEffect(() => { if (props.date && !entry.ID) setEntry({...entry, Date: moment(props.date).toDate()}); }, [props.date]);
  useEffect(() => { if (props.selected && !entry.ID) {
    setEntry({...entry,
              Note: entry.Note
              || (props.selected[0] && props.selected[0].replace(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][-0-9a-z]* |\.(png|jpg)$/gi, ''))
              || '',
              PictureList: props.selected,
              Category: entry.Category || ((props.selected[0] || '').match(/png/) ? 'Thoughts' : '')});
  }
                  }, [props.selected]);
  const setDate = (date) => {
    setEntry({...entry, Date: date});
  };
  
  return (
    <form className={classes.root} noValidate onSubmit={saveEntry}>
    <Grid container>
      <Grid item xs={12} sm={6}>
        <TextField label="Note" multiline name='note' value={entry.Note} onChange={handleChange} autoFocus className={classes.note} />
        <TextField label="Other" multiline name='other' value={entry.Other} onChange={handleChange} className={classes.note} />
        <CategoryList value={entry.Category} onChange={handleChange} onKeyPress={handleKey} />
        <DateSelector value={moment(entry.Date).toDate()} onChange={setDate} />
        <FormActions saveEntry={saveEntry} splitEntry={splitEntry} deleteEntry={deleteEntry} id={entry && entry.ID} />
        <Link to={"/entries/" + (props.entry && props.entry.ID ? props.entry.ID : 'new')}>Full form</Link> {message}
        <QuickSearchForRef zid={entry.ZIDString} onClick={linkEntryWhileEditing} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className="large"><PhotoList onClick={deselectPhoto} data={entry.PictureList}/></div>
      </Grid>
    </Grid>
    </form>);
}


function FormActions(props) {
  let id = props.id || (props.entry && props.entry.ID);
  return (<span>
                     <Button className="save" variant="contained" color="primary" onClick={props.saveEntry}>Save</Button>
                     <Button className="split" variant="contained" onClick={props.splitEntry}>Split</Button>
                     {id ? <Button className="delete" variant="contained" onClick={props.deleteEntry}>Delete</Button> : null}
                   </span>);
}

export function QuickSearchForRef(props) {
  const [ query, setQuery ] = useState(props.note);
  const [ entries, setEntries ] = useState([]);
  const [ selected, setSelected ] = useState([]);
  const getData = (event) => {
    if (event) { event.preventDefault(); }
    if (!query) return null;
    let params = {q: query, limit: 10};
    fetch('/api/entries?' + objToQueryString(params)).then(res => res.json())
      .then(data => {
        setEntries(data.filter((o) => {
          if (props.zid) {
            if (o.ZIDString >= props.zid) return false;
          }
          return true;
        })); } );
    return false;
  };
  useEffect((o) => {
    if (props.other) {
      let m = props.other.match(/ref:[0-9]{4}-[0-9][0-9]-[0-9][0-9]-[0-9][0-9]/g);
      if (m) {
        setSelected(m.map((o) => o.replace(/ref:/, '')));
      }
    }
  }, [props.other]);
  const handleChange = (event) => {
    setQuery(event.target.value); 
  };
    
  return (<div>
            <TextField label="search" name="search" value={query} onBlur={getData} onChange={handleChange} />
            <IconButton onClick={getData}><SearchIcon/></IconButton>
            <EntryList entries={entries} onClick={props.onClick} selected={selected} options={{other: true}}/>
          </div>);
}

export default function EntryForm(props) {
  const { idParam } = useParams();
  const queryString = require('query-string');
  const parsed = queryString.parse(props.location && props.location.search);
  const [dateData, setDateData] = useState({});
  const [quick, setQuick] = useState(parsed.quick);
  const [entry, setEntry] = useState({Note: '',
                                      Other: '',
                                      PictureList: props.photos || (parsed.filename ? [parsed.filename] : []),
                                      Date: props.date,
                                      Time: moment(props.Date).format('HH:mm:ss'),
                                      Category: ''});
  useEffect(() => {
    setEntry({...entry, ...__.pick(parsed, ['Note', 'Other', 'Category']) });
  }, []);
  useEffect(() => {
    if (quick && entry && entry.Note) {
      saveEntry();
      setQuick(false);
      console.log(entry);
      history.push('/new');
    }
  }, [entry]);
  const [message, setMessage] = useState('');
  
  const { saveEntry, splitEntry, deleteEntry, handleChange, handleKey } = useEntryBehavior({entry, setEntry, setMessage});
  //useEffect(() => { if (props.date && (entry.Date != props.date)) setEntry({...entry, Date: props.date}); }, [props.date]);
  //useEffect(() => { if (props.photos) setEntry({...entry, PictureList: props.photos}); }, [props.photos]);
  useEffect(() => {
    if (idParam) fetchEntry(idParam);
    else if (props.id) fetchEntry(props.id);
  }, [idParam, props.id]);
  useEffect(() => { if (props.entry) setEntry(props.entry); }, [props.entry]);
  const fetchEntryByZID = (id) => {
    fetch('/api/entries?zid=' + id)
      .then((res) => res.json())
      .then((data) => { data && data[0] && setEntry(data[0]); });
  };
  useEffect(() => {
    if (props.ZIDString) {
      fetchEntryByZID(props.ZIDString); 
    }
  }, [props.ZIDString]);
  
  const fetchEntry = (id) => {
    fetch('/api/entries/' + id)
      .then((res) => res.json())
      .then((data) => { setEntry(data); });
  };
  const fetchDataForTheDay = () => {
    fetch('/api/date/' + moment(entry.Date).format('YYYY-MM-DD'))
      .then((res) => res.json())
      .then((data) => setDateData(data));
  };
  const onClickRef = (event, ref) => {
    if (!entry.Other.match('ref:' + ref.ZIDString)) {
      setEntry({...entry, Other: (entry.Other || '') + "\nref:" + ref.ZIDString});
    }
  };

  const setDate = (date) => {
    setEntry({...entry, Date: date});
  };
  
  useEffect(fetchDataForTheDay, [entry.Date]);
  const classes = useStyles();
  const selectPhoto = (e, p) => {
    if (!entry.PictureList || !entry.PictureList.includes(p)) {
      setEntry({...entry, PictureList: [...(entry.PictureList || []), p]});
    }
  };
  const deselectPhoto = (e, p) => {
    setEntry({...entry, PictureList: (entry.PictureList || []).filter(d => d !== p)});
  };
  const unlinkedPhotos = dateData && dateData.unlinkedPhotos && dateData.unlinkedPhotos.filter(d => !(entry.PictureList || []).includes(d.filename));
  let actions = <FormActions saveEntry={saveEntry} splitEntry={splitEntry} deleteEntry={deleteEntry} id={entry.ID}/>;
  if (props.quick) {
    return <QuickEntryForm entry={entry}/>;
  } else {
    return (
      <div>
        {message}
        <form className={classes.root} noValidate onSubmit={saveEntry}>
          {entry && entry.ZIDString ? <Link to={"/zid/" + entry.ZIDString}>{entry.ZIDString}</Link> : 'New'} {actions}
          <TextField label="Note" multiline name='note' value={entry.Note || ''} onChange={handleChange} autoFocus className={classes.note} />
          <TextField label="Other" multiline name='other' value={entry.Other || ''} onChange={handleChange} className={classes.note} />
          <CategoryList value={entry.Category || ''} onChange={handleChange} onKeyPress={handleKey} />
          <TextField label="Time" value={entry.Time || ''} onChange={handleChange} name="time" />
          <PhotoList data={entry.PictureList || []} onClick={deselectPhoto}/>         
          <PhotoList data={unlinkedPhotos || []} onClick={selectPhoto}/>            
          {actions}
        </form>
        <QuickSearchForRef onClick={onClickRef} />
        <DateSelector value={moment(entry.Date).toDate()} onChange={setDate} />
        <EntryTree entries={dateData && dateData.entries} options={{other: true}}/>
      </div>
    );
  }
}

