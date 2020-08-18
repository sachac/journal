import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import DateSelector from '../components/DateSelector';
import EntryTree from '../components/EntryTree';
import PhotoList from '../components/PhotoList';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import { useParams } from "react-router-dom";
import CategoryList from "../components/CategoryList";

const useStyles = makeStyles(theme => ({
    note: { width: '100%' },
    category: { width: '100%' },
    [theme.breakpoints.down('sm')]: {
        root: {
            fontSize: 'large',
            '& .MuiInputBase-root': { fontSize: 'x-large' }
        }
    },
}));


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

    const setEntry = (data) => {
        setNote(data.Note || '');
        setID(data.ID || 0);
        setCategory(data.Category || '');
        setOther(data.Other || '');
        setDate(moment(data.Date).toDate());
        setTime(data.Time || moment(data.Date).format('HH:mm:ss'));
        setPhotos(data.PictureList || []);
    };

    useEffect(() => { if (props.date) setDate(props.date); }, [props.date]);
    useEffect(() => { if (props.photos) setPhotos(props.photos); }, [props.photos]);
    useEffect(() => {
        if (idParam && !props.id && !props.entry) fetchEntry(idParam);
        else if (props.id && !props.entry) fetchEntry(props.id);
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
        if (!props.quick) {
            fetch('/api/date/' + moment(date).format('YYYY-MM-DD'))
                .then((res) => res.json())
                .then((data) => setDateData(data));
        }
    };
    useEffect(fetchDataForTheDay, [date]);
    

    const deleteEntry = () => {
        if (id) {
            fetch('/api/entries/' + id, { method: 'DELETE' })
                .then(() => {
                    if (props.onSubmit) { props.onSubmit(); }
                });
        }
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
                                      Pictures: photos ? photos.join(',') : ''
                                     })
            }).then((res) => res.json())
                .then((res) => {
                    if (props.entry) {
                        // TODO: Fix! Do not modify
                        Object.assign(props.entry, res);
                    }
                    if (props.onSubmit) { props.onSubmit(res); }
                });
        } else {
            let newEntry = {Note: note,
                            Category: category,
                            Other: other,
                            Date: moment(date).format('YYYY-MM-DD'),
                            Time: time,
                            Pictures: photos ? [...new Set(photos)].join(',') : ''
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
    useEffect(() => { if (props.entry) { setEntry(props.entry); } }, [props.entry]);
    const classes = useStyles();
    const selectPhoto = (e, p) => {
        if (photos && !photos.includes(p)) {
            setPhotos([...photos, p]);
        }
    };
    const deselectPhoto = (e, p) => {
        setPhotos(photos.filter(d => d !== p));
    };
    const unlinkedPhotos = dateData && dateData.unlinkedPhotos && dateData.unlinkedPhotos.filter(d => !photos.includes(d));
    if (props.quick) {
        return (
            <form className={classes.root} noValidate onSubmit={saveEntry}>
              <TextField label="Note" multiline name='note' value={note} onChange={handleChange} autoFocus className={classes.note} />
              <TextField label="Other" multiline name='other' value={other} onChange={handleChange} className={classes.note} />
              <CategoryList value={category} onChange={handleChange} className={classes.category} />
              <Button className="save" variant="contained" color="primary" onClick={saveEntry}>Save</Button>
              {id ? <Button className="delete" variant="contained" onClick={deleteEntry}>Delete</Button> : null }
            </form>
        );
    } else {
        return (
            <div>
              <form className={classes.root} noValidate onSubmit={saveEntry}>
                <div><Button className="save" variant="contained" color="primary" onClick={saveEntry}>Save</Button>
                  {id ? <Button className="delete" variant="contained" onClick={deleteEntry}>Delete</Button> : null }
                </div>
                <TextField label="Note" multiline name='note' value={note} onChange={handleChange} autoFocus className={classes.note} />
                <TextField label="Other" multiline name='other' value={other} onChange={handleChange} className={classes.note} />
                <CategoryList value={category} onChange={handleChange} className={classes.category} onKeyPress={handleKey} />
                <TextField label="Time" value={time} onChange={handleChange} name="time" />
                <div className="large">
                  <PhotoList data={photos} onClick={deselectPhoto}/>
                </div>
                <DateSelector value={date} onChange={setDate} />
                <PhotoList data={unlinkedPhotos} onClick={selectPhoto}/>            
                <div><Button className="save" onClick={saveEntry}>Save</Button></div>
              </form>
              {!props.quickEdit && <EntryTree entries={dateData && dateData.entries}/>}
            </div>
        );
    }
}

