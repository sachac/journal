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

function QuickSearchForRef(props) {
  const [ query, setQuery ] = useState(props.note);
  const [ entries, setEntries ] = useState([]);
  const [ selected, setSelected ] = useState([]);
  
  useEffect((o) => { setQuery(props.note.replace(/"/g, '')); }, [props.note]);
  useEffect((o) => { getDataDebounced(); }, [query, props.zid]);
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
  const [date, setDate] = useState(moment(parsed.date).toDate());
  const [time, setTime] = useState(moment().format('HH:mm:ss'));
  const [dateData, setDateData] = useState({});
  const [photos, setPhotos] = useState(parsed.filename ? [parsed.filename] : []);
  const [ZIDString, setZIDString] = useState('');
  const [message, setMessage] = useState('');
  const setEntry = (data) => {
    setNote(data.Note || '');
    setID(data.ID || 0);
    setZIDString(data.ZIDString);
    setCategory(data.Category || '');
    setOther(data.Other || '');
    setDate(moment(data.Date).toDate());
    setTime(data.Time || moment(data.Date).format('HH:mm:ss'));
    setPhotos(data.PictureList || []);
  };

  useEffect(() => { if (props.date) setDate(props.date); }, [props.date]);
  useEffect(() => { if (props.photos) setPhotos(props.photos); }, [props.photos]);
  useEffect(() => { if (props.id) fetchEntry(props.id); }, [props.id]);
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
    fetch('/api/date/' + moment(date).format('YYYY-MM-DD'))
      .then((res) => res.json())
      .then((data) => setDateData(data));
  };
  const deleteEntry = () => {
    if (id) {
      fetch('/api/entries/' + id, { method: 'DELETE' })
        .then(() => {
          if (props.onSubmit) { props.onSubmit(); }
        });
    }
  };
  const splitEntry = async () => {
    let noteBodies = note.split(/\n+/);
    let newEntry = {Category: category,
                    Other: other,
                    Date: moment(date).format('YYYY-MM-DD'),
                    Time: time,
                    PictureList: photos
                   };
    await noteBodies.reduce((prevPromise, cur) => {
      return prevPromise.then((_) => {
        return fetch('/api/entries', {
          method: 'POST',
          headers: {'Content-Type': 'application/json' },
          body: JSON.stringify({...newEntry, Note: cur})
        }).then((res) => res.json()).then((o) => {
          setMessage(`Created ${o.ZIDString}: ${o.Note}`);
        });
      });
    }, Promise.resolve([]));
  };
  const saveEntry = () => {
    if (id) {
      fetch('/api/entries/' + id, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({Note: note,
                              Category: category,
                              Other: other,
                              Date: moment(date).format('YYYY-MM-DD'),
                              Time: time,
                              PictureList: photos
                             })
      }).then((res) => res.json())
        .then((res) => {
          if (props.onSubmit) { props.onSubmit(res); }
        });
    } else {
      let newEntry = {Note: note,
                      Category: category,
                      Other: other,
                      Date: moment(date).format('YYYY-MM-DD'),
                      Time: time,
                      PictureList: photos
                     };
      fetch('/api/entries', {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      }).then((res) => {
        if (props.onSubmit) { props.onSubmit(res); }
        // After creating a new entry, clear the items and update the list of entries for the day
        setEntry({Time: moment().format('HH:mm:ss'), Date: moment(date).format('YYYY-MM-DD')});
      });
    }
  };
  const handleKey = event => {
    if (event.key === 'Enter' && event.ctrlKey) {
      saveEntry();
    }
  };
  const handleChange = event => {
    if (event.target.name === 'note') setNote(event.target.value);
    if (event.target.name === 'category') setCategory(event.target.value);
    if (event.target.name === 'other') setOther(event.target.value);
    if (event.target.name === 'time') {
      setDate(moment(moment(date).format('YYYY-MM-DD') + ' ' + event.target.value));
      setTime(event.target.value);
    }
  };
  const onClickRef = (event, entry) => {
    if (!other.match('ref:' + entry.ZIDString)) {
      setOther(other + "\nref:" + entry.ZIDString);
    }
  };
  
  useEffect(fetchDataForTheDay, [date]);
  useEffect(() => { if (props.entry) { setEntry(props.entry); } }, [props.entry]);
  useEffect(() => {
    if (idParam) fetchEntry(idParam);
    else if (props.id) fetchEntry(props.id);
  }, [idParam, props.id]);
  const classes = useStyles();
  const selectPhoto = (e, p) => {
    if (photos && !photos.includes(p)) {
      setPhotos([...photos, p]);
    }
  };
  const deselectPhoto = (e, p) => {
    setPhotos(photos.filter(d => d !== p));
  };
  const unlinkedPhotos = dateData && dateData.unlinkedPhotos && dateData.unlinkedPhotos.filter(d => !photos.includes(d.filename));
  const actions = (<span>
                     <Button className="save" variant="contained" color="primary" onClick={saveEntry}>Save</Button>
                     <Button className="split" variant="contained" color="primary" onClick={splitEntry}>Split</Button>
                     {props.id ? <Button className="delete" variant="contained" onClick={deleteEntry}>Delete</Button> : null}
                   </span>);
  if (props.quick) {
    return (
      <form className={classes.root} noValidate onSubmit={saveEntry}>
        <TextField label="Note" multiline name='note' value={note} onChange={handleChange} autoFocus className={classes.note} />
        <TextField label="Other" multiline name='other' value={other} onChange={handleChange} className={classes.note} />
        <CategoryList value={category} onChange={handleChange} className={classes.category} />
        {actions}
        <Link to={"/entries/" + (id ? id : 'new')}>Full form</Link> {message}
      </form>
    );
  } else {
    return (
      <div>
        <form className={classes.root} noValidate onSubmit={saveEntry}>
          {actions}
          <TextField label="Note" multiline name='note' value={note} onChange={handleChange} autoFocus className={classes.note} />
          <TextField label="Other" multiline name='other' value={other} onChange={handleChange} className={classes.note} />
          <CategoryList value={category} onChange={handleChange} className={classes.category} onKeyPress={handleKey} />
          <TextField label="Time" value={time} onChange={handleChange} name="time" />
          <PhotoList data={photos} onClick={deselectPhoto}/>         
          <PhotoList data={unlinkedPhotos} onClick={selectPhoto}/>            
          {actions}
        </form>
        <Grid container spacing={3}>
          <Grid item sm>
            <DateSelector value={date} onChange={setDate} />
            <EntryTree entries={dateData && dateData.entries}/>
          </Grid>
          <Grid item sm>
            <QuickSearchForRef note={note} onClick={onClickRef} zid={ZIDString} other={other}/>
          </Grid>
        </Grid>
      </div>
    );
  }
}

