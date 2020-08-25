import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { Link } from 'react-router-dom';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
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
    let noteBodies = entry.note.split(/\n+/);
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
    }, Promise.resolve([]));
  };
  const saveEntry = () => {
    if (entry.ID) {
      fetch('/api/entries/' + entry.ID, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).then((res) => res.json())
        .then((res) => {
          setEntry(res);
          if (props.onSubmit) { props.onSubmit(res); }
        });
    } else {
      fetch('/api/entries', {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).then((res) => {
        if (props.onSubmit) { props.onSubmit(res); }
        // After creating a new entry, clear the items and update the list of entries for the day
        setEntry({Time: moment().format('HH:mm:ss'), Date: moment(res.Date).format('YYYY-MM-DD')});
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
  return { handleChange, saveEntry, deleteEntry, splitEntry };
}

export function QuickEntryForm(props) {
  const classes = useStyles();
  const [ entry, setEntry ] = useState({id: props.id, Category: ''});
  const [ message, setMessage ] = useState('');
  const { saveEntry, splitEntry, deleteEntry, handleChange } = useEntryBehavior({entry, setEntry, setMessage, onSubmit: props.onSubmit});
  useEffect(() => { if (props.entry) setEntry(props.entry); }, [props.entry]);
  return <form className={classes.root} noValidate onSubmit={saveEntry}>
    <TextField label="Note" multiline name='note' value={entry.Note} onChange={handleChange} autoFocus className={classes.note} />
    <TextField label="Other" multiline name='other' value={entry.Other} onChange={handleChange} className={classes.note} />
    <CategoryList value={entry.Category} onChange={handleChange} className={classes.category} />
           <FormActions saveEntry={saveEntry} splitEntry={splitEntry} deleteEntry={deleteEntry} id={entry && entry.ID} />
    <Link to={"/entries/" + (props.entry && props.entry.ID ? props.entry.ID : 'new')}>Full form</Link> {message}
  </form>;
}


function FormActions(props) {
  let id = props.id || (props.entry && props.entry.ID);
  return (<span>
                     <Button className="save" variant="contained" color="primary" onClick={props.saveEntry}>Save</Button>
                     <Button className="split" variant="contained" onClick={props.splitEntry}>Split</Button>
                     {id ? <Button className="delete" variant="contained" onClick={props.deleteEntry}>Delete</Button> : null}
                   </span>);
}

function QuickSearchForRef(props) {
  const [ query, setQuery ] = useState(props.note);
  const [ entries, setEntries ] = useState([]);
  const [ selected, setSelected ] = useState([]);
  useEffect((o) => { getDataDebounced(); }, [query]);
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
  const getDataDebounced = debounce(5000, getData);
  
  return (<div>
            <TextField label="search" name="search" value={query} onChange={handleChange} />
            <IconButton onClick={getData}><SearchIcon/></IconButton>
            <EntryList entries={entries} onClick={props.onClick} selected={selected}/>
          </div>);
}

export default function EntryForm(props) {
  const { idParam } = useParams();
  const [id, setID] = useState(0);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [other, setOther] = useState('');
  const queryString = require('query-string');
  const parsed = queryString.parse(props.location && props.location.search);
  const [dateData, setDateData] = useState({});
  const [entry, setEntry] = useState({PictureList: parsed.filename ? [parsed.filename] : []});
  const [ZIDString, setZIDString] = useState('');
  const [message, setMessage] = useState('');
  const { saveEntry, splitEntry, deleteEntry, handleChange } = useEntryBehavior({entry, setEntry, setMessage});
  // const setEntry = (data) => {
    
  //   setNote(data.Note || '');
  //   setID(data.ID || 0);
  //   setZIDString(data.ZIDString);
  //   setCategory(data.Category || '');
  //   setOther(data.Other || '');
  //   setDate(moment(data.Date).toDate());
  //   setTime(data.Time || moment(data.Date).format('HH:mm:ss'));
  //   setPhotos(data.PictureList || []);
  // };

  useEffect(() => { if (props.date) setEntry({...entry, Date: props.date}); }, [props.date]);
  useEffect(() => { if (props.photos) setEntry({...entry, PictureList: props.photos}); }, [props.photos]);
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
  const handleKey = event => {
    if (event.key === 'Enter' && event.ctrlKey) {
      saveEntry();
    }
  };
  const onClickRef = (event, entry) => {
    if (!entry.Other.match('ref:' + entry.ZIDString)) {
      setEntry({...entry, Other: entry.other + "\nref:" + entry.ZIDString});
    }
  };

  const setDate = (date) => {
    setEntry({...entry, Date: moment(date).format('YYYY-MM-DD')});
    
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
        <form className={classes.root} noValidate onSubmit={saveEntry}>
          {actions}
          <TextField label="Note" multiline name='note' value={entry.Note} onChange={handleChange} autoFocus className={classes.note} />
          <TextField label="Other" multiline name='other' value={entry.Other} onChange={handleChange} className={classes.note} />
          <CategoryList value={entry.Category} onChange={handleChange} className={classes.category} onKeyPress={handleKey} />
          <TextField label="Time" value={entry.Time} onChange={handleChange} name="time" />
          <PhotoList data={entry.PictureList} onClick={deselectPhoto}/>         
          <PhotoList data={unlinkedPhotos} onClick={selectPhoto}/>            
          {actions}
        </form>
        <QuickSearchForRef onClick={onClickRef} zid={ZIDString} other={other}/>
        <DateSelector value={entry.Date} onChange={setDate} />
        <EntryTree entries={dateData && dateData.entries}/>
      </div>
    );
  }
}

