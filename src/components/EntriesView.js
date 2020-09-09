import React, {useState, useEffect} from 'react';
import EntryWall from './EntryWall';
import EntryTree from './EntryTree';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Tab from '@material-ui/core/Tab';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import InputAdornment from '@material-ui/core/InputAdornment';
import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';


import SimpleReactLightbox, { SRLWrapper } from "simple-react-lightbox";
export function GalleryView(props) {
  let photos = [];
  if (props.entries) {
    photos = props.entries.reduce((prev, cur) => {
      if (cur.PictureList) {
        prev = prev.concat([...new Set(cur.PictureList)].map((o) => { return {
          src: '/thumbnails/' + o,
          width: 1,
          alt: cur.ZIDString + ': ' + cur.Note + ' (' + o + ')'}; }));
      }
      return prev;
    }, []);
  }
  return <SimpleReactLightbox><SRLWrapper>{photos.map((o) => <img key={o.src} src={o.src} alt={o.alt} className="thumbnail" />)}</SRLWrapper></SimpleReactLightbox>;
}

export default function EntriesView(data) {
  let entries;
  const [ entryList, setEntryList ] = useState(data.entries);
  const [ options, setOptions ] = useState({other: true, images: true, private: true, filter: ''});
  const [ view, setView ] = useState(data.view || 'tree');
  const changeView = (event, newValue) => {
    setView(newValue);
  };
  const filterEntries = (list) => {
    let filtered = list;
    if (options.private === false) {
      filtered = filtered.filter((o) => !o.isPrivate);
    }
    if (options.filter) {
      filtered = filtered.filter((o) => ([(o.Category || ''), (o.Note || ''), (o.Other || '')].join(' ')).match(new RegExp(options.filter, 'i')));
    }
    return filtered;
  };
  
  useEffect(() => { setEntryList(filterEntries(data.entries)); }, [data.entries]);
  useEffect(() => { setEntryList(filterEntries(data.entries)); }, [options]);
  const handleChange = (event) => {
    if (event.target.name === 'other') { setOptions({...options, other: event.target.checked}); }
    if (event.target.name === 'images') { setOptions({...options, images: event.target.checked}); }
    if (event.target.name === 'private') { setOptions({...options, private: event.target.checked}); }
    if (event.target.name === 'filter') { setOptions({...options, filter: event.target.value}); }
  };
  if (view === 'cards') {
    entries = <EntryWall {...data} entries={entryList} options={options} includeDate={true} />;
  } else if (view === 'tree') {
    entries = <EntryTree {...data} entries={entryList} options={options} sort="category" />;
  } else if (view === 'gallery') {
    entries = <GalleryView {...data} entries={entryList} options={options} sort="date" />;
  } else {
    entries = <EntryTree {...data} entries={entryList} options={options} sort="date" />;
  }
  const handleClearFilter = () => { setOptions({...options, filter: ''}); };
  
  return (<div>
            <FormGroup row className="horizontal-form">
              <TextField label="Filter" value={options.filter || ''} onChange={handleChange} name="filter" InputProps={{
                endAdornment: <InputAdornment position="end">
                                <IconButton onClick={handleClearFilter} style={{order: 1}}>
                                  <ClearIcon color="disabled" fontSize="small" />
                                </IconButton>
                              </InputAdornment>}}/>
              <FormControlLabel control={<Checkbox checked={options.other} onChange={handleChange} name="other" />} label="Other"/>
              <FormControlLabel control={<Checkbox checked={options.images} onChange={handleChange} name="images" />} label="Images"/>
              <FormControlLabel control={<Checkbox checked={options.private} onChange={handleChange} name="private" />} label="Private"/>
            </FormGroup>
            <Tabs value={view} onChange={changeView} aria-label="view type">
              <Tab name="view" value="tree" label="Tree"/>
              <Tab name="view" value="list" label="List"/>
              <Tab name="view" value="cards" label="Cards"/>
              <Tab name="view" value="gallery" label="Gallery"/>
            </Tabs>
            {entries}
          </div>);
}
